import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function TodoCard({ id, title, description, status, onStatusChange, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(id);
  };

  const handleStatusChange = (e) => {
    e.stopPropagation();
    onStatusChange(id, e.target.value);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-2 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-800">{title}</h3>
        <button 
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {description && (
        <p className="text-sm text-gray-600 mb-3">{description}</p>
      )}
      
      <div className="flex justify-between mt-2">
        <select
          value={status}
          onChange={handleStatusChange}
          className="text-xs border border-gray-300 rounded px-2 py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
} 