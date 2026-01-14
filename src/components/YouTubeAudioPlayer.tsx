import { useState, useRef, useEffect, useCallback } from "react";
import { Youtube, Link, X, Play, Pause, RotateCcw, ListMusic, SkipForward, Trash2, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface YouTubeAudioPlayerProps {
  isActive: boolean;
  isMuted: boolean;
  onActiveChange: (active: boolean) => void;
}

interface SavedTrack {
  id: string;
  url: string;
  title: string;
  isPlaylist: boolean;
}

const SAVED_PLAYLIST_KEY = "jast-youtube-saved-playlist";

// Default playlist of sample YouTube videos
const DEFAULT_PLAYLIST = [
  { id: "cKxRFlXYquo", title: "Lofi 1" },
  { id: "RG2IK8oRZNA", title: "Lofi 2" },
  { id: "k2w_tU8Cy9c", title: "Lofi 3" },
  { id: "k9ts6p63ns0", title: "Lofi 4" },
  { id: "sAcj8me7wGI", title: "Lofi 5" },
];

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Extract playlist ID from YouTube URL
function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&\n?#]+)/);
  return match ? match[1] : null;
}

// Generate a short title from URL
function generateTitle(url: string): string {
  const vid = extractVideoId(url);
  const pid = extractPlaylistId(url);
  if (pid) return `Playlist ${pid.slice(0, 6)}...`;
  if (vid) return `Video ${vid.slice(0, 6)}...`;
  return "Unknown";
}

export function YouTubeAudioPlayer({ isActive, isMuted, onActiveChange }: YouTubeAudioPlayerProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDefaultPlaylist, setUsingDefaultPlaylist] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [savedPlaylist, setSavedPlaylist] = useState<SavedTrack[]>([]);
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved playlist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_PLAYLIST_KEY);
      if (saved) {
        setSavedPlaylist(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load saved playlist:", e);
    }
  }, []);

  // Save playlist to localStorage
  const savePlaylists = useCallback((tracks: SavedTrack[]) => {
    setSavedPlaylist(tracks);
    try {
      localStorage.setItem(SAVED_PLAYLIST_KEY, JSON.stringify(tracks));
    } catch (e) {
      console.error("Failed to save playlist:", e);
    }
  }, []);

  // Add track to saved playlist
  const addToSavedPlaylist = useCallback((url: string) => {
    const vid = extractVideoId(url);
    const pid = extractPlaylistId(url);
    if (!vid && !pid) return;
    
    const id = pid || vid || "";
    // Check if already exists
    if (savedPlaylist.some(t => t.id === id)) return;
    
    const newTrack: SavedTrack = {
      id,
      url,
      title: generateTitle(url),
      isPlaylist: !!pid,
    };
    savePlaylists([...savedPlaylist, newTrack]);
  }, [savedPlaylist, savePlaylists]);

  // Remove track from saved playlist
  const removeFromSavedPlaylist = useCallback((id: string) => {
    savePlaylists(savedPlaylist.filter(t => t.id !== id));
  }, [savedPlaylist, savePlaylists]);

  // Play a saved track
  const playSavedTrack = useCallback((track: SavedTrack) => {
    setError(null);
    setUsingDefaultPlaylist(false);
    if (track.isPlaylist) {
      setPlaylistId(track.id);
      setVideoId(null);
    } else {
      setVideoId(track.id);
      setPlaylistId(null);
    }
    setShowInput(false);
    setShowSavedList(false);
    onActiveChange(true);
  }, [onActiveChange]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize player when video/playlist is set
  useEffect(() => {
    if (!videoId && !playlistId) return;
    if (!window.YT?.Player) {
      // Wait for API to load
      const checkReady = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(checkReady);
          initPlayer();
        }
      }, 100);
      return () => clearInterval(checkReady);
    } else {
      initPlayer();
    }

    function initPlayer() {
      // Destroy existing player
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      const playerVars: YT.PlayerVars = {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        loop: 1,
      };

      if (playlistId) {
        playerVars.listType = "playlist";
        playerVars.list = playlistId;
      }

      playerRef.current = new window.YT.Player("youtube-player", {
        height: "1",
        width: "1",
        videoId: videoId || undefined,
        playerVars,
        events: {
          onReady: (event) => {
            event.target.setVolume(30);
            if (isMuted) {
              event.target.mute();
            }
            event.target.playVideo();
            setIsPlaying(true);
            // Start tracking progress
            startProgressTracking();
          },
          onStateChange: (event) => {
            // Handle video end - loop or go to next in default playlist
            if (event.data === window.YT.PlayerState.ENDED) {
              if (usingDefaultPlaylist) {
                // Go to next track in default playlist
                const nextIndex = (currentTrackIndex + 1) % DEFAULT_PLAYLIST.length;
                setCurrentTrackIndex(nextIndex);
                setVideoId(DEFAULT_PLAYLIST[nextIndex].id);
              } else if (videoId && !playlistId) {
                // Loop single video
                event.target.seekTo(0, true);
                event.target.playVideo();
              }
            }
          },
          onError: (event) => {
            console.error("YouTube player error:", event.data);
            setError("Failed to load video. Please check the URL.");
          },
        },
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      stopProgressTracking();
    };
  }, [videoId, playlistId]);

  // Handle mute changes
  useEffect(() => {
    if (playerRef.current) {
      try {
        if (isMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
        }
      } catch (e) {
        // Player not ready yet
      }
    }
  }, [isMuted]);

  // Cleanup when not active
  useEffect(() => {
    if (!isActive && playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
      setVideoId(null);
      setPlaylistId(null);
      setYoutubeUrl("");
      stopProgressTracking();
    }
  }, [isActive]);

  // Progress tracking functions
  const startProgressTracking = useCallback(() => {
    stopProgressTracking();
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current) {
        try {
          const currentTime = (playerRef.current as any).getCurrentTime?.() || 0;
          const totalDuration = (playerRef.current as any).getDuration?.() || 0;
          setProgress(currentTime);
          setDuration(totalDuration);
        } catch (e) {
          // Player not ready
        }
      }
    }, 500);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * duration;
    playerRef.current.seekTo(seekTime, true);
    setProgress(seekTime);
  }, [duration]);

  const handleSubmit = useCallback(() => {
    setError(null);
    const vid = extractVideoId(youtubeUrl);
    const pid = extractPlaylistId(youtubeUrl);

    if (!vid && !pid) {
      setError("Invalid YouTube URL. Please enter a valid video or playlist link.");
      return;
    }

    // Add to saved playlist
    addToSavedPlaylist(youtubeUrl);

    setUsingDefaultPlaylist(false);
    setVideoId(vid);
    setPlaylistId(pid);
    setShowInput(false);
    setYoutubeUrl("");
    onActiveChange(true);
  }, [youtubeUrl, onActiveChange, addToSavedPlaylist]);

  const handlePlayDefaultPlaylist = useCallback(() => {
    setError(null);
    setUsingDefaultPlaylist(true);
    setCurrentTrackIndex(0);
    setVideoId(DEFAULT_PLAYLIST[0].id);
    setPlaylistId(null);
    setShowInput(false);
    onActiveChange(true);
  }, [onActiveChange]);

  const handleSkipTrack = useCallback(() => {
    if (usingDefaultPlaylist) {
      const nextIndex = (currentTrackIndex + 1) % DEFAULT_PLAYLIST.length;
      setCurrentTrackIndex(nextIndex);
      setVideoId(DEFAULT_PLAYLIST[nextIndex].id);
    }
  }, [usingDefaultPlaylist, currentTrackIndex]);

  const handleClear = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    setVideoId(null);
    setPlaylistId(null);
    setYoutubeUrl("");
    setError(null);
    setUsingDefaultPlaylist(false);
    setCurrentTrackIndex(0);
    onActiveChange(false);
  }, [onActiveChange]);

  const togglePlayPause = useCallback(() => {
    if (playerRef.current) {
      try {
        if (isPlaying) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (e) {
        // Player not ready
      }
    }
  }, [isPlaying]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Hidden YouTube player */}
      <div 
        id="youtube-player" 
        className="absolute -left-[9999px] -top-[9999px] w-0 h-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      />

      {/* YouTube button / controls */}
      {isActive && (videoId || playlistId) ? (
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={togglePlayPause}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                  aria-label={isPlaying ? "Pause YouTube" : "Play YouTube"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black/80 text-white border-white/20">
                {isPlaying ? "Pause" : "Play"}
              </TooltipContent>
            </Tooltip>
            
            {/* Progress bar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  onClick={handleSeek}
                  className="w-16 h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all group"
                >
                  <div 
                    className="h-full bg-red-400/80 rounded-full relative"
                    style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : '0%' }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black/80 text-white border-white/20">
                Seek
              </TooltipContent>
            </Tooltip>

            {usingDefaultPlaylist && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleSkipTrack}
                    className="p-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all"
                    aria-label="Skip to next track"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-black/80 text-white border-white/20">
                  Next track
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleClear}
                  className="p-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all"
                  aria-label="Stop YouTube and use local audio"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black/80 text-white border-white/20">
                Switch to local audio
              </TooltipContent>
            </Tooltip>
            {usingDefaultPlaylist && (
              <span className="text-white/50 text-xs ml-1">
                {currentTrackIndex + 1}/{DEFAULT_PLAYLIST.length}
              </span>
            )}
          </div>
        </TooltipProvider>
      ) : (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowInput(!showInput)}
                className={`p-2 rounded-lg transition-all ${
                  showInput 
                    ? "bg-red-500/30 text-red-400" 
                    : "bg-white/10 text-white/70 hover:text-white hover:bg-white/20"
                }`}
                aria-label="Add YouTube audio"
              >
                <Youtube className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-black/80 text-white border-white/20">
              YouTube audio
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* URL input dropdown */}
      {showInput && (
        <div 
          className="absolute top-full mt-2 right-0 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 animate-scale-in z-[100] w-80"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-2">
            <Link className="w-4 h-4 text-white/50" />
            <span className="text-white/70 text-sm">YouTube URL</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") setShowInput(false);
              }}
              placeholder="Paste video or playlist link..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/40"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              className="px-3 py-2 rounded-lg bg-red-500/80 text-white text-sm hover:bg-red-500 transition-all"
            >
              Play
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-xs mt-2">{error}</p>
          )}

          {/* Saved playlist section */}
          {savedPlaylist.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowSavedList(!showSavedList)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm hover:bg-white/20 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ListMusic className="w-4 h-4" />
                  <span>Your Saved ({savedPlaylist.length})</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSavedList ? "rotate-180" : ""}`} />
              </button>
              
              {showSavedList && (
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
                  {savedPlaylist.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                    >
                      <button
                        onClick={() => playSavedTrack(track)}
                        className="flex-1 text-left text-white/70 text-sm hover:text-white truncate pr-2"
                      >
                        <span className="mr-2">{track.isPlaylist ? "📋" : "🎵"}</span>
                        {track.title}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromSavedPlaylist(track.id);
                        }}
                        className="p-1 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Remove from playlist"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Default playlist button */}
          <button
            onClick={handlePlayDefaultPlaylist}
            className="w-full mt-3 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <ListMusic className="w-4 h-4" />
            Play Lofi Playlist
          </button>
          
          <p className="text-white/40 text-xs mt-2">
            Works with videos & playlists
          </p>
          <button
            onClick={() => setShowInput(false)}
            className="absolute top-2 right-2 p-1 text-white/40 hover:text-white/70"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// YouTube IFrame API type declarations
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }

  namespace YT {
    class Player {
      constructor(
        elementId: string | HTMLElement,
        options: PlayerOptions
      );
      playVideo(): void;
      pauseVideo(): void;
      stopVideo(): void;
      seekTo(seconds: number, allowSeekAhead: boolean): void;
      mute(): void;
      unMute(): void;
      setVolume(volume: number): void;
      getVolume(): number;
      getCurrentTime(): number;
      getDuration(): number;
      destroy(): void;
    }

    interface PlayerOptions {
      height?: string | number;
      width?: string | number;
      videoId?: string;
      playerVars?: PlayerVars;
      events?: PlayerEvents;
    }

    interface PlayerVars {
      autoplay?: 0 | 1;
      controls?: 0 | 1;
      disablekb?: 0 | 1;
      fs?: 0 | 1;
      modestbranding?: 0 | 1;
      rel?: 0 | 1;
      showinfo?: 0 | 1;
      loop?: 0 | 1;
      listType?: "playlist" | "user_uploads";
      list?: string;
      playlist?: string;
    }

    interface PlayerEvents {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
      onError?: (event: OnErrorEvent) => void;
    }

    interface PlayerEvent {
      target: Player;
    }

    interface OnStateChangeEvent {
      target: Player;
      data: PlayerState;
    }

    interface OnErrorEvent {
      target: Player;
      data: number;
    }

    enum PlayerState {
      UNSTARTED = -1,
      ENDED = 0,
      PLAYING = 1,
      PAUSED = 2,
      BUFFERING = 3,
      CUED = 5,
    }
  }
}
