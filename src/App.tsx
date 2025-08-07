import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Banner from './components/Banner';
import MovieRow from './components/MovieRow';
import MovieModal from './components/MovieModal';
import { fetchMovies, fetchMovieDetails, type Movie, BASE_URL, API_KEY, IMG_URL } from './lib/tmdb';

function App() {
  // State for different movie/TV show categories
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
  const [popularTV, setPopularTV] = useState<Movie[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingTV, setTrendingTV] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use simple, direct API endpoints that are most likely to work
        const [
          popular,
          topRated,
          upcoming,
          nowPlaying,
          tvPopular,
          tvTopRated,
          trendingM,
          trendingT
        ] = await Promise.all([
          fetchMovies('/movie/popular'),
          fetchMovies('/movie/top_rated'),
          fetchMovies('/movie/upcoming'),
          fetchMovies('/movie/now_playing'),
          fetchMovies('/tv/popular'),
          fetchMovies('/tv/top_rated'),
          fetchMovies('/trending/movie/week'),
          fetchMovies('/trending/tv/week')
        ]);

        // Remove console logs in production
        // console.log('Popular Movies:', popular);
        
        setPopularMovies(popular || []);
        setTopRatedMovies(topRated || []);
        setUpcomingMovies(upcoming || []);
        setNowPlayingMovies(nowPlaying || []);
        setPopularTV(tvPopular || []);
        setTopRatedTV(tvTopRated || []);
        setTrendingMovies(trendingM || []);
        setTrendingTV(trendingT || []);
      } catch (error) {
        console.error('Error fetching movies:', error);
        setError('Failed to load content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const handleMovieClick = async (movieId: number, mediaType?: string) => {
    try {
      setSelectedMovie(null); // Clear previous movie before loading new one
      
      // Try to determine if this is a TV show or movie based on mediaType if provided
      const isTV = mediaType === 'tv';
      
      // If mediaType is provided, use it to fetch the right content type
      let movieDetails;
      if (isTV) {
        // Fetch as TV show
        const response = await fetch(
          `${BASE_URL}/tv/${movieId}?api_key=${API_KEY}&append_to_response=credits,videos,seasons,external_ids`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch TV show details');
        }
        movieDetails = await response.json();
        
        // Map any TV show specific fields
        if (movieDetails.name && !movieDetails.title) {
          movieDetails.title = movieDetails.name;
        }
        
        // Ensure we have media_type set
        movieDetails.media_type = 'tv';
        
        // Map external IDs
        if (movieDetails.external_ids && movieDetails.external_ids.imdb_id) {
          movieDetails.imdb_id = movieDetails.external_ids.imdb_id;
        }
      } else {
        // Let the fetchMovieDetails function try both endpoints
        movieDetails = await fetchMovieDetails(movieId);
      }
      
      if (!movieDetails || !movieDetails.id) {
        throw new Error('Invalid content details');
      }
      
      setSelectedMovie(movieDetails);
    } catch (error) {
      console.error('Error fetching content details:', error);
      // Could show a toast notification here
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl max-w-md text-center px-4">
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get banner movies from multiple categories for variety and remove duplicates
  const allPotentialBannerMovies = [
    ...(popularMovies.slice(0, 3) || []),
    ...(trendingMovies.slice(0, 3) || []),
    ...(topRatedMovies.slice(0, 2) || []),
    ...(upcomingMovies.slice(0, 2) || []),
    ...(nowPlayingMovies.slice(0, 2) || [])
  ];
  
  // Shuffle the array to get random selection
  const shuffledMovies = [...allPotentialBannerMovies]
    .sort(() => 0.5 - Math.random())
    .filter(movie => movie && movie.backdrop_path)
    // Filter out duplicates by movie ID
    .filter((movie, index, self) => 
      index === self.findIndex(m => m.id === movie.id)
    )
    .slice(0, 5); // Limit to 5 featured movies
    
  const bannerMovies = shuffledMovies.length > 0 ? shuffledMovies : 
    // Fallback if shuffle produced no results
    allPotentialBannerMovies.filter(movie => movie && movie.backdrop_path)
      .filter((movie, index, self) => index === self.findIndex(m => m.id === movie.id))
      .slice(0, 5);

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      
      {/* Remove the padding-top since navbar is transparent */}
      <div>
        {bannerMovies.length > 0 && (
          <Banner movies={bannerMovies} autoPlayInterval={3000} />
        )}
        
        {/* Featured section moved up to be directly underneath the banner */}
        <div className="container mx-auto max-w-screen-2xl animate-fadein -mt-10 mb-4 relative z-20">
          <div className="px-4 md:px-6 lg:px-8">
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-white">Featured</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
              {popularMovies.slice(0, 6).map((movie, index) => (
                <div 
                  key={movie.id} 
                  className="aspect-[2/3] rounded-md overflow-hidden cursor-pointer card-hover-effect relative"
                  onClick={() => handleMovieClick(movie.id, movie.media_type || 'movie')}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {movie.poster_path ? (
                    <img 
                      src={`${IMG_URL}${movie.poster_path}`}
                      alt={movie.title || movie.name || ''}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center p-2">
                      <span className="text-white text-center font-medium text-xs">
                        {movie.title || movie.name || 'No Image Available'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 transition-opacity">
                    <h3 className="text-white font-semibold text-xs md:text-sm truncate">{movie.title || movie.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <main className="relative z-10 container mx-auto max-w-screen-2xl animate-fadein">
        {/* Standard movie rows */}
        <div className="pb-12 space-y-10">
          <MovieRow
            title="Popular Right Now"
            movies={popularMovies}
            onMovieClick={handleMovieClick}
            rowType="movie"
          />
          <MovieRow
            title="Top Rated Of All Time"
            movies={topRatedMovies}
            onMovieClick={handleMovieClick}
            rowType="movie"
          />
          <MovieRow
            title="Coming Soon"
            movies={upcomingMovies}
            onMovieClick={handleMovieClick}
            rowType="movie"
          />
          <MovieRow
            title="Now Playing In Theaters"
            movies={nowPlayingMovies}
            onMovieClick={handleMovieClick}
            rowType="movie"
          />
          
          {/* TV Shows Section with section divider */}
          <div className="relative pt-4 pb-2">
            <h2 className="text-2xl md:text-3xl font-bold px-4 md:px-6 lg:px-8 mb-6 text-white">TV Shows</h2>
            <div className="px-4 md:px-6 lg:px-8 space-y-10">
              <MovieRow
                title="Popular This Week"
                movies={popularTV}
                onMovieClick={handleMovieClick}
                rowType="tv"
              />
              <MovieRow
                title="All-Time Favorites"
                movies={topRatedTV}
                onMovieClick={handleMovieClick}
                rowType="tv"
              />
            </div>
          </div>
          
          {/* Trending Section with section divider */}
          <div className="relative pt-4 pb-2">
            <h2 className="text-2xl md:text-3xl font-bold px-4 md:px-6 lg:px-8 mb-6 text-white">Trending Now</h2>
            <div className="px-4 md:px-6 lg:px-8 space-y-10">
              <MovieRow
                title="Movies"
                movies={trendingMovies}
                onMovieClick={handleMovieClick}
                rowType="movie"
              />
              <MovieRow
                title="TV Shows"
                movies={trendingTV}
                onMovieClick={handleMovieClick}
                rowType="tv"
              />
            </div>
          </div>
        </div>
      </main>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}

export default App;