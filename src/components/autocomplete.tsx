import { Loader2 } from 'lucide-react'
import { useCombobox } from 'downshift'
import { Input } from './ui/input'
import { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type InputProps = Omit<ComponentProps<'input'>, 'onSelect' | 'results'>

type AutocompleteProps<ResultValue> = InputProps & {
  results: Array<ResultValue>
  isLoading?: boolean
  onSearch: (value: string) => void
  onSelect: (item: ResultValue) => void
  renderItem: (item: ResultValue, active: boolean) => React.ReactNode
  onInputValueChange?: (changes: { inputValue: string | undefined }) => void
  itemToString?: (item: ResultValue | null) => string
  onSelectedItemChange?: (changes: {
    selectedItem: ResultValue | undefined
  }) => void
}

export function Autocomplete<ResultValue>({
  results,
  isLoading,
  onSearch,
  onSelect,
  renderItem,
  onInputValueChange,
  onSelectedItemChange,
  itemToString,
  ...inputProps
}: AutocompleteProps<ResultValue>) {
  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
    reset,
  } = useCombobox({
    items: results,
    // See: https://github.com/downshift-js/downshift/issues/964#issuecomment-595059407
    itemToString: itemToString,
    onInputValueChange: (changes) => {
      onSearch(changes.inputValue || '')
      onInputValueChange?.(changes)
    },
    onSelectedItemChange: (changes) => {
      if (changes.selectedItem) {
        onSelect(changes.selectedItem)
        reset()
      }
      onSelectedItemChange?.(changes)
    },
  })

  const { className, ...rest } = inputProps

  return (
    <div className="relative">
      <Input
        {...getInputProps()}
        className={cn('w-full', className)}
        {...rest}
      />
      {isLoading && <Loader2 className="absolute right-2 top-2 animate-spin" />}

      {/* Can't conditionally render this */}
      {/* See: https://github.com/downshift-js/downshift/issues/1167#issuecomment-1088022842 */}
      <ul
        {...getMenuProps()}
        className={cn(
          'absolute z-10 mt-0.5 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg transition-all',
          {
            'border opacity-100': isOpen && results.length > 0,
            'pointer-events-none opacity-0': !isOpen || results.length === 0,
          }
        )}
      >
        {results.map((item, index) => (
          <li
            key={index}
            {...getItemProps({ item, index })}
            className="cursor-pointer"
          >
            {renderItem(item, highlightedIndex === index)}
          </li>
        ))}
      </ul>
    </div>
  )
}
