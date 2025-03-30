import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TodoCard } from './TodoCard';

export function TodoColumn({ title, status, todos, onStatusChange, onDelete }) {
  const columnColors = {
    'todo': 'bg-blue-50 border-blue-200',
    'in_progress': 'bg-yellow-50 border-yellow-200',
    'done': 'bg-green-50 border-green-200'
  };

  return (
    <div className={`p-4 rounded-lg ${columnColors[status]} border`}>
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      
      <SortableContext items={todos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
        <div>
          {todos.length === 0 ? (
            <div className="text-center text-gray-500 p-4">No items</div>
          ) : (
            todos.map(todo => (
              <TodoCard
                key={todo.id}
                id={todo.id}
                title={todo.title}
                description={todo.description}
                status={todo.status}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
} 