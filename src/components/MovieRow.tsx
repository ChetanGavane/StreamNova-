import { Movie, IMG_URL } from '../lib/tmdb';
import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type MovieRowProps = {
  title: string;
  movies?: Movie[];
  onMovieClick: (movieId: number, mediaType?: string) => void;
  rowType?: 'movie' | 'tv'; // Explicit row type to help with content identification
};

// Create a memoized movie card component to prevent unnecessary re-renders
const MovieCard = memo(({ 
  movie, 
  onClick, 
  mediaType 
}: { 
  movie: Movie; 
  onClick: () => void; 
  mediaType: string;
}) => {
  // Use state to lazy load images only when they become visible
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set up an intersection observer to detect when the card is in the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // No need to observe once visible
        }
      },
      { threshold: 0.1, rootMargin: "100px" } // Load when 10% visible or within 100px of viewport
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="flex-none w-[250px] cursor-pointer transform transition hover:scale-105"
      onClick={onClick}
      ref={imgRef}
    >
      {movie.poster_path ? (
        <div className="w-full h-[375px] rounded-lg bg-zinc-900">
          {isVisible && (
            <img
              src={`${IMG_URL}${movie.poster_path}`}
              alt={movie.title || movie.name || 'Movie poster'}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
      ) : (
        <div className="rounded-lg w-full h-[375px] bg-zinc-800 flex items-center justify-center">
          <span className="text-white text-center p-4">
            {movie.title || movie.name || 'No poster available'}
          </span>
        </div>
      )}
      <h3 className="text-white mt-2 truncate">
        {movie.title || movie.name || 'Untitled'}
      </h3>
      <p className="text-xs text-gray-400">
        {mediaType === 'tv' ? 'TV Show' : 'Movie'}
      </p>
    </div>
  );
});

// Add display name for React DevTools
MovieCard.displayName = 'MovieCard';

function MovieRow({ title, movies = [], onMovieClick, rowType }: MovieRowProps) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const [isRowVisible, setIsRowVisible] = useState(false);
  const rowContainerRef = useRef<HTMLDivElement>(null);

  // Don't process anything if there are no movies
  if (!movies || movies.length === 0) {
    return null;
  }

  // Filter out movies without poster paths - use memoization for performance
  const validMovies = useMemo(() => 
    movies.filter(movie => movie && movie.poster_path)
  , [movies]);

  if (validMovies.length === 0) {
    return null;
  }

  // Use visibility observer to only load content when row is near viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRowVisible(true);
          observer.disconnect();
        }
      }, 
      { rootMargin: "200px" } // Start loading when row is within 200px of viewport
    );
    
    if (rowContainerRef.current) {
      observer.observe(rowContainerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Check if scroll navigation is needed - with debounce to improve performance
  useEffect(() => {
    if (!isRowVisible) return;

    let scrollTimer: NodeJS.Timeout | null = null;
    
    const checkScroll = () => {
      if (rowRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
        setShowLeftArrow(scrollLeft > 20);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
      }
    };

    // Debounced scroll handler
    const handleScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(checkScroll, 100);
    };

    // Initial check
    checkScroll();

    // Optimized event listener
    const currentRef = rowRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        if (scrollTimer) clearTimeout(scrollTimer);
        currentRef.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isRowVisible, validMovies]);

  // Optimized scroll functions
  const scrollLeft = () => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mb-8" ref={rowContainerRef}>
      <h2 className="text-2xl font-semibold text-white mb-4">{title}</h2>
      {isRowVisible && (
        <div className="relative group">
          {/* Left scroll button */}
          {showLeftArrow && (
            <button 
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black/70 p-2 rounded-full z-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Row content */}
          <div 
            ref={rowRef}
            className="flex space-x-3 md:space-x-4 overflow-x-scroll scrollbar-hide styled-scrollbar pb-8 pt-1 scroll-smooth px-4"
            style={{ 
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {validMovies.map((movie, index) => {
              // Determine the media type from available information
              const mediaType = movie.media_type || rowType || (movie.name && !movie.title ? 'tv' : 'movie');
              
              return (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  mediaType={mediaType}
                  onClick={() => onMovieClick(movie.id, mediaType)}
                />
              );
            })}
          </div>

          {/* Right scroll button */}
          {showRightArrow && (
            <button 
              onClick={scrollRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black/70 p-2 rounded-full z-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Export memoized component to prevent unnecessary rerenders
export default memo(MovieRow);