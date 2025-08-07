import { Search, Bell, User, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { searchTMDB, SearchResult } from '../utils/tmdb';
import { fetchMovieDetails, API_KEY, BASE_URL } from '../lib/tmdb';
import MovieModal from './MovieModal';

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Series', href: '#series' },
  { label: 'Movies', href: '#movies' },
  { label: 'New & Popular', href: '#new' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSearch && 
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearch]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        try {
          const results = await searchTMDB(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 2) {
      setIsSearching(true);
      searchTMDB(searchQuery)
        .then(results => {
          setSearchResults(results);
        })
        .catch(error => {
          console.error('Error during search:', error);
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }
  };

  const handleMovieClick = async (result: SearchResult) => {
    try {
      // First, check if it's a movie or TV show
      const mediaType = result.media_type || (result.title ? 'movie' : 'tv');
      
      // Fetch full details including external IDs
      if (mediaType === 'tv') {
        // Fetch as TV show
        const response = await fetch(
          `${BASE_URL}/tv/${result.id}?api_key=${API_KEY}&append_to_response=credits,videos,seasons,external_ids`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch TV show details');
        }
        const details = await response.json();
        
        // Map any TV show specific fields
        if (details.name && !details.title) {
          details.title = details.name;
        }
        
        // Ensure we have media_type set
        details.media_type = 'tv';
        
        // Map external IDs
        if (details.external_ids && details.external_ids.imdb_id) {
          details.imdb_id = details.external_ids.imdb_id;
        }
        
        // Set the selected movie with the TV details
        setSelectedMovie(details);
      } else {
        // Fetch movie details
        const details = await fetchMovieDetails(result.id);
        
        // Make sure we have the full data with IMDb IDs
        if (details && details.id) {
          setSelectedMovie(details);
        } else {
          console.error('Failed to get complete details for', result.title || result.name);
        }
      }
      
      // Close search UI
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error fetching complete movie/TV details:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  return (
    <>
      <nav className={`fixed top-0 z-50 w-full px-4 py-4 transition-colors duration-300 ${
        isScrolled ? 'bg-black' : 'bg-transparent'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-4xl font-bold text-red-600">NETMAX</h1>
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(item.label);
                  }}
                  className={`text-white hover:text-gray-300 transition-colors ${
                    activeTab === item.label ? 'font-semibold' : ''
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              {showSearch ? (
                <div className="relative" ref={searchResultsRef}>
                  <form onSubmit={handleSearch} className="flex items-center bg-transparent border border-white/20 rounded">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Titles, people, genres"
                      className="bg-transparent text-white px-4 py-1 outline-none w-48 md:w-64"
                      aria-label="Search for titles, people, or genres"
                    />
                    <button
                      type="submit"
                      className="px-2 text-white hover:text-gray-300"
                      aria-label="Submit search"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="px-2 text-white hover:text-gray-300"
                      aria-label="Clear search"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </form>
                  
                  {searchQuery.trim().length > 2 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg max-h-96 overflow-y-auto w-96 z-50">
                      {isSearching ? (
                        <div className="p-4 text-white text-center">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        <div className="py-2">
                          {searchResults.map((result) => (
                            <div
                              key={`${result.media_type}-${result.id}`}
                              className="flex items-center p-2 hover:bg-white/10 cursor-pointer"
                              onClick={() => handleMovieClick(result)}
                              role="button"
                              tabIndex={0}
                              aria-label={`View details for ${result.title || result.name}`}
                            >
                              {result.poster_path ? (
                                <div className="w-12 h-18 relative mr-3 flex-shrink-0">
                                  <img
                                    src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                                    alt={result.title || result.name || ''}
                                    className="w-full h-full object-cover rounded"
                                    loading="lazy"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-18 bg-zinc-700/80 rounded mr-3 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs p-1 text-center">No Image</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium truncate">
                                  {result.title || result.name || 'Untitled'}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {result.media_type === 'movie' ? 'Movie' : 'TV Show'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-white text-center">No results found</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="text-white hover:text-gray-300"
                  aria-label="Open search"
                >
                  <Search className="h-6 w-6" />
                </button>
              )}
            </div>
            <Bell className="h-6 w-6 text-white cursor-pointer hover:text-gray-300" />
            <User className="h-6 w-6 text-white cursor-pointer hover:text-gray-300" />
          </div>
        </div>
      </nav>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </>
  );
}