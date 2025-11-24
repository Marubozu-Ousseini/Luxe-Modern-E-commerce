import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts?: Record<string, number>;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onSelectCategory, categoryCounts }) => {
  return (
    <div className="mb-8 flex justify-center">
  <div className="flex items-center space-x-2 sm:space-x-3 bg-sky-50 p-1.5 rounded-full overflow-x-auto border border-sky-100">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 text-sm sm:text-base font-semibold rounded-full transition-all duration-150 ease-premium whitespace-nowrap transform border ${
              selectedCategory === category
                ? 'bg-blue-900 text-white border-blue-900 shadow-inner scale-[1.02]'
                : 'bg-sky-200 text-blue-900 border-sky-300 hover:bg-sky-300 hover:border-sky-400'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span>{category}</span>
              {categoryCounts && typeof categoryCounts[category] === 'number' && (
                <span className={`${selectedCategory === category ? 'bg-white/25 text-white' : 'bg-white text-blue-900'} text-[11px] leading-4 px-2 py-0.5 rounded-full`}>{categoryCounts[category]}</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
