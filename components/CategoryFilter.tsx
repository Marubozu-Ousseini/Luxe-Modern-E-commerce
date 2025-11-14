import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="mb-8 flex justify-center">
      <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-100 p-1.5 rounded-full overflow-x-auto">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 text-sm sm:text-base font-semibold rounded-full transition-all duration-200 whitespace-nowrap ${
              selectedCategory === category
                ? 'bg-primary-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
