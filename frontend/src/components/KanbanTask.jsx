import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function KanbanTask({ task, onEditClick }) {
    const { 
        attributes, 
        listeners, 
        setNodeRef, 
        transform, 
        transition, 
        isDragging // Use this to style the item while dragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1, // Make item semi-transparent when dragged
        touchAction: 'none' // Prevent scrolling on touch devices when dragging
    };

    const handleEdit = (e) => {
        // Prevent triggering edit when dragging starts
        // Check if the click target is the draggable handle itself or the container
        // A simpler check might be needed depending on exact drag handle usage
         if (e.target.closest('[data-dndkit-drag-handle]')) {
             // Might need adjustment based on how listeners are applied
             // return;
         }
        onEditClick(task); // Call the passed handler with the task data
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners} // Attach listeners to make the whole card draggable
            onClick={!isDragging ? handleEdit : undefined} 
            className={`kanban-task bg-white p-2 border rounded shadow-sm text-sm ${!isDragging ? 'cursor-pointer hover:shadow-md' : 'cursor-grabbing'}`}
        >
            <p className="font-medium pointer-events-none">{task.title}</p>
        </div>
    );
}

export default KanbanTask; 