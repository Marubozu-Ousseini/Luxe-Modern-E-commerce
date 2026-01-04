import React from 'react';

interface CategoryItem { value: string; label: string }
interface CategoryFilterProps {
  categories: CategoryItem[];
  selectedCategory: string; // underlying value ('Tous' or backend category value)
  onSelectCategory: (categoryValue: string) => void;
  categoryCounts?: Record<string, number>; // keyed by underlying value
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onSelectCategory, categoryCounts }) => {
  return (
    <div className="mb-8 flex justify-center">
      <div className="flex items-center space-x-2 sm:space-x-3 bg-bone p-1.5 rounded-full overflow-x-auto border border-sand">
        {categories.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onSelectCategory(value)}
            className={`px-4 py-2 text-sm sm:text-base font-semibold rounded-full transition-all duration-150 ease-premium whitespace-nowrap transform border ${
              selectedCategory === value
                ? 'bg-accent text-white border-accent shadow-inner scale-[1.02]'
                : 'bg-white text-charcoal border-sand hover:border-taupe'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span>{label}</span>
              {categoryCounts && typeof categoryCounts[value] === 'number' && (
                <span className={`${selectedCategory === value ? 'bg-white/25 text-white' : 'bg-bone text-charcoal'} text-[11px] leading-4 px-2 py-0.5 rounded-full`}>{categoryCounts[value]}</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
