import { useState, useRef, useEffect, useCallback } from "react";
import { Youtube, Link, X, Play, Pause, ListMusic, SkipForward, Trash2, Music } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface YouTubeAudioPlayerProps {
  isActive: boolean;
  isMuted: boolean;
  onActiveChange: (active: boolean) => void;
  /** Whether dropdown should open upward (true) or downward (false) */
  dropdownUp?: boolean;
}

interface SavedTrack {
  id: string;
  url: string;
  title: string;
  isPlaylist: boolean;
  isLocal?: boolean;
}

const SAVED_PLAYLIST_KEY = "jast-youtube-saved-playlist";

// Local audio track (always first, non-removable)
const LOCAL_AUDIO_TRACK: SavedTrack = {
  id: "local-dreamer",
  url: "/audio/dreamer.mp3",
  title: "Dreamer (Local)",
  isPlaylist: false,
  isLocal: true,
};

// Default lofi tracks to seed the playlist
const DEFAULT_LOFI_TRACKS: SavedTrack[] = [
  LOCAL_AUDIO_TRACK,
  { id: "cKxRFlXYquo", url: "https://www.youtube.com/watch?v=cKxRFlXYquo", title: "Lofi Hip Hop Radio", isPlaylist: false },
  { id: "RG2IK8oRZNA", url: "https://www.youtube.com/watch?v=RG2IK8oRZNA", title: "Chill Lofi Beats", isPlaylist: false },
  { id: "k2w_tU8Cy9c", url: "https://www.youtube.com/watch?v=k2w_tU8Cy9c", title: "Study Music Mix", isPlaylist: false },
  { id: "k9ts6p63ns0", url: "https://www.youtube.com/watch?v=k9ts6p63ns0", title: "Relaxing Lofi", isPlaylist: false },
  { id: "sAcj8me7wGI", url: "https://www.youtube.com/watch?v=sAcj8me7wGI", title: "Focus Beats", isPlaylist: false },
  { id: "acjs8sDZDro", url: "https://www.youtube.com/watch?v=acjs8sDZDro", title: "Peaceful Lofi", isPlaylist: false },
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

// Fetch video title from YouTube oEmbed API
async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (response.ok) {
      const data = await response.json();
      return data.title || `Video ${videoId.slice(0, 6)}...`;
    }
  } catch (e) {
    console.error("Failed to fetch video title:", e);
  }
  return `Video ${videoId.slice(0, 6)}...`;
}

// Generate a fallback title from URL
function generateFallbackTitle(url: string): string {
  const vid = extractVideoId(url);
  const pid = extractPlaylistId(url);
  if (pid) return `Playlist ${pid.slice(0, 6)}...`;
  if (vid) return `Video ${vid.slice(0, 6)}...`;
  return "Unknown";
}

export function YouTubeAudioPlayer({ isActive, isMuted, onActiveChange, dropdownUp = false }: YouTubeAudioPlayerProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showInput, setShowInput] = useState(false);
  
  const [videoId, setVideoId] = useState<string | null>(null);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingFromList, setIsPlayingFromList] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [savedPlaylist, setSavedPlaylist] = useState<SavedTrack[]>([]);
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved playlist from localStorage and merge with default tracks
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_PLAYLIST_KEY);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge any missing default tracks into the saved playlist
        const existingIds = new Set(parsed.map((t: SavedTrack) => t.id));
        const missingDefaults = DEFAULT_LOFI_TRACKS.filter(t => !existingIds.has(t.id));
        
        // Ensure local track is first, then other defaults, then user tracks
        const userTracks = parsed.filter((t: SavedTrack) => !t.isLocal && !DEFAULT_LOFI_TRACKS.some(d => d.id === t.id));
        const mergedPlaylist = [...DEFAULT_LOFI_TRACKS, ...userTracks];
        
        setSavedPlaylist(mergedPlaylist);
        localStorage.setItem(SAVED_PLAYLIST_KEY, JSON.stringify(mergedPlaylist));
      } else {
        // First time: seed with default lofi tracks
        setSavedPlaylist(DEFAULT_LOFI_TRACKS);
        localStorage.setItem(SAVED_PLAYLIST_KEY, JSON.stringify(DEFAULT_LOFI_TRACKS));
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
  const addToSavedPlaylist = useCallback(async (url: string) => {
    const vid = extractVideoId(url);
    const pid = extractPlaylistId(url);
    if (!vid && !pid) return;
    
    const id = pid || vid || "";
    // Check if already exists
    if (savedPlaylist.some(t => t.id === id)) return;
    
    // Fetch real title for videos
    let title = generateFallbackTitle(url);
    if (vid && !pid) {
      title = await fetchVideoTitle(vid);
    }
    
    const newTrack: SavedTrack = {
      id,
      url,
      title,
      isPlaylist: !!pid,
    };
    savePlaylists([...savedPlaylist, newTrack]);
  }, [savedPlaylist, savePlaylists]);

  // Remove track from saved playlist (except local track)
  const removeFromSavedPlaylist = useCallback((id: string) => {
    if (id === LOCAL_AUDIO_TRACK.id) return; // Cannot remove local track
    savePlaylists(savedPlaylist.filter(t => t.id !== id));
  }, [savedPlaylist, savePlaylists]);

  // Play a saved track
  const playSavedTrack = useCallback((track: SavedTrack, index?: number) => {
    setError(null);
    setIsPlayingFromList(true);
    setCurrentTrackIndex(index ?? savedPlaylist.findIndex(t => t.id === track.id));
    
    // Handle local audio track
    if (track.isLocal) {
      // Stop YouTube if playing
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setVideoId(null);
      setPlaylistId(null);
      setShowInput(false);
      onActiveChange(false); // This will trigger local audio in DreamyFocusOverlay
      return;
    }
    
    if (track.isPlaylist) {
      setPlaylistId(track.id);
      setVideoId(null);
    } else {
      setVideoId(track.id);
      setPlaylistId(null);
    }
    setShowInput(false);
    onActiveChange(true);
  }, [onActiveChange, savedPlaylist]);

  // Play all from saved playlist
  const playAllFromList = useCallback(() => {
    if (savedPlaylist.length > 0) {
      playSavedTrack(savedPlaylist[0], 0);
    }
  }, [savedPlaylist, playSavedTrack]);

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
            // Handle video end - go to next in playlist if playing from list
            if (event.data === window.YT.PlayerState.ENDED) {
              if (isPlayingFromList && savedPlaylist.length > 0) {
                // Go to next track in saved playlist
                const nextIndex = (currentTrackIndex + 1) % savedPlaylist.length;
                const nextTrack = savedPlaylist[nextIndex];
                setCurrentTrackIndex(nextIndex);
                
                // Handle if next track is local
                if (nextTrack.isLocal) {
                  if (playerRef.current) {
                    playerRef.current.destroy();
                    playerRef.current = null;
                  }
                  setVideoId(null);
                  setPlaylistId(null);
                  onActiveChange(false);
                } else {
                  setVideoId(nextTrack.id);
                }
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

    setIsPlayingFromList(false);
    setVideoId(vid);
    setPlaylistId(pid);
    setShowInput(false);
    setYoutubeUrl("");
    onActiveChange(true);
  }, [youtubeUrl, onActiveChange, addToSavedPlaylist]);

  const handleSkipTrack = useCallback(() => {
    if (savedPlaylist.length > 1) {
      const nextIndex = (currentTrackIndex + 1) % savedPlaylist.length;
      const nextTrack = savedPlaylist[nextIndex];
      setCurrentTrackIndex(nextIndex);
      setIsPlayingFromList(true);
      
      // Handle local track
      if (nextTrack.isLocal) {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
        setVideoId(null);
        setPlaylistId(null);
        onActiveChange(false);
        return;
      }
      
      if (nextTrack.isPlaylist) {
        setPlaylistId(nextTrack.id);
        setVideoId(null);
      } else {
        setVideoId(nextTrack.id);
        setPlaylistId(null);
      }
      onActiveChange(true);
    }
  }, [currentTrackIndex, savedPlaylist, onActiveChange]);

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
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-1">
          {isActive && (videoId || playlistId) && (
            <>
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

              {savedPlaylist.length > 1 && (
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
              {savedPlaylist.length > 0 && (
                <span className="text-white/50 text-xs ml-1">
                  {currentTrackIndex + 1}/{savedPlaylist.length}
                </span>
              )}
            </>
          )}
          
          {/* Always show YouTube icon to access saved list */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowInput(!showInput)}
                className={`p-2 rounded-lg transition-all ${
                  showInput 
                    ? "bg-red-500/30 text-red-400" 
                    : isActive && (videoId || playlistId)
                      ? "bg-white/10 text-red-400 hover:bg-white/20"
                      : "bg-white/10 text-white/70 hover:text-white hover:bg-white/20"
                }`}
                aria-label="YouTube playlist"
              >
                <Youtube className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side={dropdownUp ? "top" : "bottom"} className="bg-black/80 text-white border-white/20">
              YouTube Playlist
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* URL input dropdown */}
      {showInput && (
        <div 
          className={`absolute right-0 p-3 rounded-xl bg-black/90 backdrop-blur-md border border-white/20 animate-scale-in z-[200] w-80 ${
            dropdownUp ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
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

          {/* Playlist section - always visible */}
          <div className="mt-3 max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
            {savedPlaylist.length > 0 ? (
              <>
                {savedPlaylist.map((track, index) => (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all group ${
                      currentTrackIndex === index 
                        ? "bg-red-500/20 text-red-400" 
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <button
                      onClick={() => playSavedTrack(track, index)}
                      className="flex-1 text-left text-sm hover:text-white truncate pr-2"
                    >
                      <span className="mr-2">
                        {track.isLocal ? "🎧" : track.isPlaylist ? "📋" : "🎵"}
                      </span>
                      {track.title}
                    </button>
                    {!track.isLocal && (
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
                    )}
                  </div>
                ))}
              </>
            ) : (
              <p className="text-white/40 text-xs text-center py-2">
                No tracks yet. Add YouTube links above!
              </p>
            )}
          </div>
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
