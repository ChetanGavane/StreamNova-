import { useState, useEffect, useCallback, useRef } from 'react';
import { Movie, IMG_URL, fetchMovieDetails } from '../lib/tmdb';
import { X, Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import MovieModal from './MovieModal';

type BannerProps = {
  movies: Movie[]; // Now accepts an array of movies
  autoPlayInterval?: number; // Time in ms between auto-scrolls
};

export default function Banner({ movies, autoPlayInterval = 5000 }: BannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0); // Track previous index for direction
  const [movieDetails, setMovieDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const carouselRef = useRef<HTMLDivElement>(null);

  // Get current movie
  const currentMovie = movies[currentIndex];
  
  // Handle direction determination based on indices
  useEffect(() => {
    if (isTransitioning) {
      // Calculate if we're moving left or right
      // Special handling for wrapping around the ends
      if (prevIndex === movies.length - 1 && currentIndex === 0) {
        setSlideDirection('right');
      } else if (prevIndex === 0 && currentIndex === movies.length - 1) {
        setSlideDirection('left');
      } else {
        setSlideDirection(currentIndex > prevIndex ? 'right' : 'left');
      }
    }
  }, [currentIndex, prevIndex, movies.length, isTransitioning]);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setPrevIndex(currentIndex);
    
    setTimeout(() => {
      setCurrentIndex(prevIndex => 
        prevIndex === movies.length - 1 ? 0 : prevIndex + 1
      );
      
      // Give a short delay before allowing next transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 200);
  }, [movies.length, isTransitioning, currentIndex]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setPrevIndex(currentIndex);
    
    setTimeout(() => {
      setCurrentIndex(prevIndex => 
        prevIndex === 0 ? movies.length - 1 : prevIndex - 1
      );
      
      // Give a short delay before allowing next transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 200);
  }, [movies.length, isTransitioning, currentIndex]);
  
  // Function to go directly to a specific slide
  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setPrevIndex(currentIndex);
    
    setTimeout(() => {
      setCurrentIndex(index);
      
      // Give a short delay before allowing next transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 200);
  }, [currentIndex, isTransitioning]);

  // Auto-scroll effect
  useEffect(() => {
    // Stop auto-scrolling if:
    // 1. User is hovering over the banner (isPaused)
    // 2. Animation is in transition (isTransitioning)
    // 3. Movie modal is open (showModal)
    if (!isPaused && !showModal && movies.length > 1 && !isTransitioning) {
      const interval = setInterval(() => {
        nextSlide();
      }, autoPlayInterval);
      
      return () => clearInterval(interval);
    }
    
    return undefined;
  }, [isPaused, showModal, nextSlide, movies.length, autoPlayInterval, isTransitioning]);

  // Fetch details for the current movie
  useEffect(() => {
    const fetchDetails = async () => {
      if (!currentMovie) return;
      
      try {
        setIsLoading(true);
        // Fetch full movie details for the modal
        const details = await fetchMovieDetails(currentMovie.id);
        setMovieDetails(details);
      } catch (error) {
        console.error('Error fetching movie details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDetails();
  }, [currentMovie]);

  // Handle actions
  const handlePlayClick = () => {
    // Show the movie details modal first, like clicking a movie in a row
    setShowModal(true);
    // Make sure current movie doesn't change while modal is open
    setIsPaused(true);
  };

  const handleInfoClick = () => {
    // Background click also shows the modal
    setShowModal(true);
    // Make sure current movie doesn't change while modal is open
    setIsPaused(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Resume auto-scrolling when modal is closed (unless user is still hovering)
    if (!document.querySelector('.group:hover')) {
      setIsPaused(false);
    }
  };

  // Pause auto-scroll when hovering
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Get movie title
  const title = currentMovie?.title || '';
  const hasBanner = currentMovie?.backdrop_path;

  if (!currentMovie || movies.length === 0) {
    return null;
  }

  // Calculate animation styles based on direction
  const getTransitionStyles = () => {
    const entryTransform = slideDirection === 'right' ? '5%' : '-5%';
    const exitTransform = slideDirection === 'right' ? '-5%' : '5%';
    
    return {
      entering: {
        transform: `translateX(${entryTransform})`,
        opacity: 0.7,
      },
      active: {
        transform: 'translateX(0)',
        opacity: 1,
      },
      exiting: {
        transform: `translateX(${exitTransform})`,
        opacity: 0.7,
      }
    };
  };

  const styles = getTransitionStyles();

  return (
    <>
      <div 
        className="relative h-[80vh] w-full group overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={carouselRef}
      >
        <div 
          className="absolute inset-0 cursor-pointer" 
          onClick={handleInfoClick}
          style={{
            transform: isTransitioning 
              ? `translateX(${slideDirection === 'right' ? '-5%' : '5%'})` 
              : 'translateX(0)',
            transition: 'transform 500ms ease-out'
          }}
        >
          {hasBanner ? (
            <img
              src={`${IMG_URL}${currentMovie.backdrop_path}`}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <span className="text-white text-2xl">No banner image available</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </div>
        
        {/* Carousel indicators */}
        {movies.length > 1 && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {movies.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'w-6 bg-red-600' : 'w-2 bg-gray-400/50'
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
        
        {/* Navigation arrows */}
        {movies.length > 1 && (
          <>
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60 z-20"
              onClick={prevSlide}
              aria-label="Previous banner"
              disabled={isTransitioning}
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
            
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60 z-20"
              onClick={nextSlide}
              aria-label="Next banner"
              disabled={isTransitioning}
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
          </>
        )}
        
        {/* Simplified content - only showing title */}
        <div 
          className="absolute bottom-10 left-0 p-12 z-10"
          style={{
            transform: isTransitioning 
              ? `translateX(${slideDirection === 'right' ? '-10%' : '10%'}) scale(0.95)` 
              : 'translateX(0) scale(1)',
            opacity: isTransitioning ? 0.7 : 1,
            transition: 'all 500ms ease-out'
          }}
        >
          <h1 className="text-6xl font-bold text-white">
            {title}
          </h1>
          
          <div className="mt-6 flex space-x-4">
            <button
              onClick={handlePlayClick}
              className="px-8 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors flex items-center space-x-2"
              disabled={isLoading}
              aria-label={`View details for ${title}`}
            >
              <Play className="h-5 w-5" />
              <span>{isLoading ? 'Loading...' : 'Play'}</span>
            </button>
            <button
              onClick={handleInfoClick}
              className="px-8 py-2 bg-gray-500 bg-opacity-50 text-white font-semibold rounded hover:bg-opacity-70 flex items-center space-x-2"
              aria-label={`More info about ${title}`}
            >
              <Info className="h-5 w-5" />
              <span>More Info</span>
            </button>
          </div>
        </div>

        {/* Edge slide peek - subtle hint of adjacent slides */}
        {movies.length > 1 && !isTransitioning && (
          <>
            <div 
              className="absolute top-0 bottom-0 left-0 w-[5%] bg-gradient-to-r from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={prevSlide}
            />
            <div 
              className="absolute top-0 bottom-0 right-0 w-[5%] bg-gradient-to-l from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={nextSlide}
            />
          </>
        )}
      </div>

      {/* MovieModal for showing details */}
      {showModal && movieDetails && (
        <MovieModal
          movie={movieDetails}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}