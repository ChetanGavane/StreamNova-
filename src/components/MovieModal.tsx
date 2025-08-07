import { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';
import { IMG_URL } from '../lib/tmdb';

type MovieModalProps = {
  movie: any;
  onClose: () => void;
  onPlay?: () => void; // Optional callback to start playback
};

export default function MovieModal({ movie, onClose, onPlay }: MovieModalProps) {
  if (!movie) return null;

  const [showPlayer, setShowPlayer] = useState(false);
  const [isTV, setIsTV] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [totalSeasons, setTotalSeasons] = useState(1);
  const [episodesPerSeason, setEpisodesPerSeason] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    // Reset the player state when movie changes
    setShowPlayer(false);
    
    // Check if it's a TV show using multiple properties for reliability
    const isTVShow = movie.number_of_seasons !== undefined || 
                   movie.first_air_date !== undefined || 
                   movie.media_type === 'tv' ||
                   movie.name !== undefined;
    setIsTV(isTVShow);
    
    if (isTVShow && movie.number_of_seasons) {
      setTotalSeasons(movie.number_of_seasons);
      
      // Set up episodes per season
      const episodeCount: { [key: number]: number } = {};
      if (movie.seasons) {
        movie.seasons.forEach((season: any) => {
          if (season.season_number > 0) { // Skip season 0 (specials)
            episodeCount[season.season_number] = season.episode_count || 10; // Default to 10 if not available
          }
        });
      }
      setEpisodesPerSeason(episodeCount);
    }
  }, [movie]);

  const handlePlayClick = () => {
    // If an external play handler is provided, use it
    if (onPlay) {
      onPlay();
    } else {
      // Otherwise, use the internal player
      setShowPlayer(true);
    }
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
  };

  const getEmbedUrl = () => {
    // Ensure we have a valid ID to prevent errors
    if (!movie || !movie.id) return '';
    
    if (isTV) {
      // For TV shows, use the IMDb ID if available, otherwise fall back to TMDB ID
      const imdbId = movie.external_ids?.imdb_id || movie.imdb_id;
      if (imdbId) {
        return `https://vidsrc.in/embed/tv?imdb=${imdbId}&season=${selectedSeason}&episode=${selectedEpisode}`;
      } else {
        console.warn('No IMDb ID found for TV show, using TMDB ID as fallback');
        return `https://vidsrc.in/embed/tv?tmdb=${movie.id}&season=${selectedSeason}&episode=${selectedEpisode}`;
      }
    } else {
      // For movies, direct TMDB ID is fine
      return `https://vidsrc.in/embed/movie/${movie.id}`;
    }
  };

  // Generate season options
  const seasonOptions = [];
  for (let i = 1; i <= totalSeasons; i++) {
    seasonOptions.push(
      <option key={`season-${i}`} value={i}>
        Season {i}
      </option>
    );
  }

  // Generate episode options
  const episodeOptions = [];
  const episodeCount = episodesPerSeason[selectedSeason] || 10;
  for (let i = 1; i <= episodeCount; i++) {
    episodeOptions.push(
      <option key={`episode-${i}`} value={i}>
        Episode {i}
      </option>
    );
  }

  // Get title based on whether it's a movie or TV show
  const title = movie.title || movie.name || 'Untitled';
  const backdropPath = movie.backdrop_path ? `${IMG_URL}${movie.backdrop_path}` : '';
  
  // Check if cast exists before trying to access it
  const hasCast = movie.credits && Array.isArray(movie.credits.cast) && movie.credits.cast.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 overflow-y-auto py-4">
      {showPlayer ? (
        <div className="w-[90vw] max-w-4xl bg-black flex flex-col rounded-lg overflow-hidden">
          <div className="flex items-center justify-between bg-zinc-900 p-4">
            <div className="flex items-center flex-wrap">
              <h2 className="text-white text-xl font-bold mr-4">
                {title}
              </h2>
              
              {isTV && (
                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                  <select
                    value={selectedSeason}
                    onChange={(e) => {
                      const newSeason = Number(e.target.value);
                      setSelectedSeason(newSeason);
                      setSelectedEpisode(1); // Reset episode to 1 when changing season
                    }}
                    className="bg-black text-white border border-white/30 rounded p-1"
                    aria-label="Select season"
                  >
                    {seasonOptions}
                  </select>
                  
                  <select
                    value={selectedEpisode}
                    onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                    className="bg-black text-white border border-white/30 rounded p-1"
                    aria-label="Select episode"
                  >
                    {episodeOptions}
                  </select>
                </div>
              )}
            </div>
            
            <button
              onClick={handleClosePlayer}
              className="text-white hover:text-gray-300"
              aria-label="Close player"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <iframe
            src={getEmbedUrl()}
            className="w-full h-[80vh]"
            title={`Watch ${title}`}
            allowFullScreen
            allow="fullscreen"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
            
            {backdropPath ? (
              <div className="w-full aspect-video relative">
                <img
                  src={backdropPath}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900"></div>
              </div>
            ) : (
              <div className="w-full aspect-video bg-zinc-800 flex items-center justify-center">
                <span className="text-white text-lg">No image available</span>
              </div>
            )}
            
            <div className="p-8">
              <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
              
              <div className="mb-6">
                <button
                  onClick={handlePlayClick}
                  className="px-8 py-3 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors flex items-center space-x-2 w-full sm:w-auto"
                >
                  <Play className="h-5 w-5" />
                  <span>Play</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-gray-300">{movie.overview || 'No overview available'}</p>
                  <p className="text-gray-400">
                    {isTV 
                      ? `First Air Date: ${movie.first_air_date || 'Unknown'}` 
                      : `Release Date: ${movie.release_date || 'Unknown'}`}
                  </p>
                  <p className="text-gray-400">Rating: {movie.vote_average ? `${movie.vote_average}/10` : 'Not rated'}</p>
                </div>
                
                {hasCast && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Cast</h3>
                    <div className="flex flex-wrap gap-4">
                      {movie.credits.cast.slice(0, 5).map((actor: any) => (
                        <div key={actor.id} className="text-center">
                          {actor.profile_path ? (
                            <img
                              src={`${IMG_URL}${actor.profile_path}`}
                              alt={actor.name}
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center">
                              <span className="text-xs text-white">{actor.name.charAt(0)}</span>
                            </div>
                          )}
                          <p className="text-sm text-gray-300 mt-2">{actor.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}