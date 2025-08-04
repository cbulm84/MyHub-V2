'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface ModernPaginationProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

export default function ModernPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange
}: ModernPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const PageButton = ({ page, isActive = false, disabled = false, onClick }: { 
    page: number | string
    isActive?: boolean
    disabled?: boolean
    onClick?: () => void
  }) => (
    <button
      onClick={onClick}
      disabled={disabled || page === '...'}
      className={`
        relative inline-flex items-center px-3 py-2 text-sm font-semibold
        transition-all duration-200 ease-in-out
        ${isActive 
          ? 'z-10 bg-alliance-blue border-alliance-blue text-white shadow-md' 
          : disabled || page === '...'
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
        }
        ${page === '...' ? 'cursor-default' : 'border'}
        ${typeof page === 'number' && !isActive ? 'hover:scale-105' : ''}
        first:rounded-l-lg last:rounded-r-lg
        focus:z-20 focus:outline-none focus:ring-2 focus:ring-alliance-blue focus:ring-offset-2
      `}
    >
      {page}
    </button>
  )

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-4 py-3 border-t border-gray-200 rounded-b-xl">
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="items-per-page" className="text-sm text-gray-700 font-medium">
          Show:
        </label>
        <select
          id="items-per-page"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="rounded-md border-gray-300 text-sm focus:border-alliance-blue focus:ring-alliance-blue"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm text-gray-700">per page</span>
      </div>

      {/* Results info */}
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center">
        {totalPages > 1 && (
          <nav className="isolate inline-flex -space-x-px rounded-lg shadow-sm" aria-label="Pagination">
            {/* Previous button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`
                relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 
                hover:bg-gray-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-alliance-blue 
                rounded-l-lg transition-all duration-200
                ${currentPage === 1 
                  ? 'cursor-not-allowed opacity-50' 
                  : 'hover:text-gray-500 hover:scale-105'
                }
              `}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Page numbers */}
            {getVisiblePages().map((page, index) => (
              <PageButton
                key={index}
                page={page}
                isActive={page === currentPage}
                onClick={typeof page === 'number' ? () => onPageChange(page) : undefined}
              />
            ))}

            {/* Next button */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`
                relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 
                hover:bg-gray-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-alliance-blue 
                rounded-r-lg transition-all duration-200
                ${currentPage === totalPages 
                  ? 'cursor-not-allowed opacity-50' 
                  : 'hover:text-gray-500 hover:scale-105'
                }
              `}
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}