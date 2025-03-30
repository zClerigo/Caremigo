import React, { useState, useCallback } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import KanbanTask from './KanbanTask';

function KanbanColumn({ id, title, tasks, onEditTask }) {
    const { setNodeRef } = useDroppable({
        id: id, // ID for the droppable area (e.g., 'todo', 'inprogress')
    });

    // Use SortableContext to make the tasks sortable within this column
    return (
        <div
            ref={setNodeRef}
            className="kanban-column bg-white rounded-lg shadow p-4 min-h-[250px] min-w-[260px] flex flex-col overflow-hidden"
        >
            <h2 className="text-lg font-semibold font-source-sans-pro text-gray-800 mb-3">{title}</h2>
            
            {/* Tasks container with flex-grow to fill available space */}
            <div className="flex-grow overflow-y-auto space-y-3">
                {tasks && tasks.length > 0 ? (
                    tasks.map((task) => (
                        <KanbanTask 
                            key={task.id} 
                            task={task} 
                            onEdit={() => onEditTask(task)} 
                        />
                    ))
                ) : (
                    <div className="text-center p-3 text-gray-400 italic font-source-sans-pro">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );
}

export default React.memo(KanbanColumn); // Use memo to prevent unnecessary rerenders 