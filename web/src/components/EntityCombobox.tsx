import { SearchIcon } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { NamedEntity } from '../../../api/src/types';

type EntityComboboxProps = {
  entities: NamedEntity[];
  label: string;
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onSelect: (entityId: string) => void;
  placeholder: string;
  query: string;
  selectedEntity: NamedEntity | null;
};

const EntityCombobox = ({
  entities,
  label,
  onClose,
  onQueryChange,
  onSelect,
  placeholder,
  query,
  selectedEntity,
}: EntityComboboxProps) => {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeEntity = entities[activeIndex];

  useEffect(() => {
    if (isOpen) {
      listRef.current
        ?.querySelector('[aria-selected="true"]')
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, isOpen]);

  const choose = (entityId: string) => {
    onSelect(entityId);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      if (entities.length > 0) {
        const offset = event.key === 'ArrowDown' ? 1 : -1;

        setActiveIndex(
          (index) => (index + offset + entities.length) % entities.length,
        );
      }
    } else if (isOpen && activeEntity && event.key === 'Enter') {
      event.preventDefault();
      choose(activeEntity.id);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      onClose();
    }
  };

  return (
    <div className="relative">
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        aria-activedescendant={
          isOpen && activeEntity ? `${listId}-${activeEntity.id}` : undefined
        }
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen}
        aria-label={label}
        autoComplete="off"
        className="pl-9"
        name="entity-search"
        onBlur={() => {
          setIsOpen(false);
          onClose();
        }}
        onChange={(event) => {
          setIsOpen(true);
          setActiveIndex(0);
          onQueryChange(event.target.value);
        }}
        onFocus={() => {
          setIsOpen(true);
          setActiveIndex(
            Math.max(
              entities.findIndex((entity) => entity.id === selectedEntity?.id),
              0,
            ),
          );
        }}
        onKeyDown={handleKeyDown}
        placeholder={selectedEntity?.name ?? placeholder}
        ref={inputRef}
        role="combobox"
        value={isOpen ? query : (selectedEntity?.name ?? query)}
      />
      {isOpen ? (
        <ul
          aria-label={label}
          className="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"
          id={listId}
          ref={listRef}
          role="listbox"
        >
          {entities.length > 0 ? (
            entities.map((entity, index) => (
              <li
                aria-selected={index === activeIndex}
                className={cn(
                  'cursor-pointer rounded-sm px-3 py-2 text-sm',
                  index === activeIndex && 'bg-muted',
                  entity.id === selectedEntity?.id &&
                    'font-semibold text-primary',
                )}
                id={`${listId}-${entity.id}`}
                key={entity.id}
                onClick={() => {
                  choose(entity.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    choose(entity.id);
                  }
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onMouseEnter={() => {
                  setActiveIndex(index);
                }}
                role="option"
              >
                {entity.name}
              </li>
            ))
          ) : (
            <li
              aria-disabled="true"
              aria-selected="false"
              className="px-3 py-2 text-sm text-muted-foreground"
              role="option"
            >
              Нема совпаѓања
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
};

export { EntityCombobox };
