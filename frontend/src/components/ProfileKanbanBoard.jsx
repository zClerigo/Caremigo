import React, { useState, useEffect, useRef, memo } from 'react';
import axios from 'axios';
import { 
    DndContext, 
    closestCorners, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors, 
    DragOverlay // Optional: For visual drag overlay
} from '@dnd-kit/core';
import { 
    SortableContext, 
    verticalListSortingStrategy, 
    arrayMove // Import arrayMove
} from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn'; // Assuming KanbanColumn and KanbanTask components exist
import KanbanTask from './KanbanTask'; // Import KanbanTask if using DragOverlay
import EditTaskModal from './EditTaskModal'; // Import the modal

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const COLUMNS = {
    todo: 'To Do',
    inprogress: 'In Progress',
    done: 'Done'
};

function ProfileKanbanBoard({ profile }) {
    const [tasks, setTasks] = useState({}); // Tasks organized by status: { todo: [], inprogress: [], done: [] }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTask, setActiveTask] = useState(null); // For DragOverlay
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Modal state
    const [editingTask, setEditingTask] = useState(null); // Task to edit
    const [records, setRecords] = useState([]); // Medical records for this profile
    const [isCreatingTasks, setIsCreatingTasks] = useState(false); // Flag to prevent concurrent creation
    const isMounted = useRef(false); // Ref to track component mount status

    // Fetch tasks and records when profile changes
    useEffect(() => {
        setLoading(true);
        isMounted.current = true; // Component is mounted
        
        // Fetch tasks
        const fetchTasks = axios.get(`${API_URL}/api/profiles/${profile.id}/tasks/`);
        
        // Fetch medical records
        const fetchRecords = axios.get(`${API_URL}/api/profiles/${profile.id}/records/`);
        
        // Use Promise.all to fetch both in parallel
        Promise.all([fetchTasks, fetchRecords])
            .then(([tasksResponse, recordsResponse]) => {
                if (!isMounted.current) return; // Check if component is still mounted
                // Process tasks
                const organizedTasks = Object.keys(COLUMNS).reduce((acc, status) => {
                    acc[status] = tasksResponse.data.filter(task => task.status === status).sort((a, b) => a.order - b.order);
                    return acc;
                }, {});
                setTasks(organizedTasks);
                
                // Process records
                setRecords(recordsResponse.data);
                
                setLoading(false);
            })
            .catch(err => {
                if (!isMounted.current) return; // Check if component is still mounted
                console.error(`Error fetching data for profile ${profile.id}:`, err);
                setError('Failed to load data.');
                setLoading(false);
            });
        
        // Cleanup function to set isMounted to false when component unmounts
        return () => {
            isMounted.current = false;
        };
    }, [profile.id]); // Dependency array includes profile.id
    
    // Create tasks from records - Added isCreatingTasks flag check
    useEffect(() => {
        // Only run if not loading, not already creating, and records exist
        if (!loading && !isCreatingTasks && records.length > 0) {
            createTasksFromRecords();
        }
        // We only want this effect to run when loading finishes or records change,
        // and critically, not when isCreatingTasks changes.
    }, [records, loading]); // Keep dependencies as [records, loading]
    
    // Check if medical records exist that don't have corresponding tasks and create them
    const createTasksFromRecords = async () => {
        if (!records.length || isCreatingTasks) return; // Exit if no records or already creating
        
        setIsCreatingTasks(true); // Set flag
        console.log("Starting createTasksFromRecords...");
        
        try {
            // Get existing tasks for this profile from backend
            const tasksResponse = await axios.get(`${API_URL}/api/profiles/${profile.id}/tasks/`);
            if (!isMounted.current) return; // Check mount status after async call
            const allTasks = tasksResponse.data;
            
            // Create a map of existing tasks with normalized titles (lowercase and trimmed)
            const existingTaskMap = {};
            allTasks.forEach(task => {
                const normalizedTitle = task.title.toLowerCase().trim();
                existingTaskMap[normalizedTitle] = task;
            });
            
            console.log("Existing task map:", existingTaskMap);
            
            // Filter records that don't have a corresponding task
            const recordsWithoutTasks = records.filter(record => {
                const normalizedTitle = record.title.toLowerCase().trim();
                // Also check if a task with this title exists in the *current* frontend state
                // This adds an extra layer of protection against rapid UI updates
                const existsInCurrentState = Object.values(tasks).flat().some(t => t.title.toLowerCase().trim() === normalizedTitle);
                return !existingTaskMap[normalizedTitle] && !existsInCurrentState;
            });
            
            console.log("Records without tasks (after filtering):", recordsWithoutTasks);
            
            if (recordsWithoutTasks.length === 0) {
                 console.log("No new tasks need to be created.");
                 setIsCreatingTasks(false); // Reset flag early if no tasks to create
                 return;
            }
            
            // Create tasks for records without tasks
            const createdTasksBatch = [];
            const failedCreations = [];
            
            for (const record of recordsWithoutTasks) {
                try {
                    const normalizedTitle = record.title.toLowerCase().trim();
                    // Final check before API call
                    if (existingTaskMap[normalizedTitle]) {
                        console.log(`Skipping creation, task already exists in backend map: ${normalizedTitle}`);
                        continue;
                    }
                    
                    console.log(`Attempting to create task for record: ${record.title.trim()}`);
                    const response = await axios.post(`${API_URL}/api/profiles/${profile.id}/tasks/`, {
                        title: record.title.trim(),
                        description: `Follow up on medical record from ${new Date(record.date).toLocaleDateString()}`,
                        status: 'todo'
                    });
                    
                    if (!isMounted.current) return; // Check mount status
                    
                    console.log("Created task from record:", response.data);
                    createdTasksBatch.push(response.data);
                    
                    // Add to existing map immediately to prevent duplicates *within this batch*
                    existingTaskMap[normalizedTitle] = response.data;
                    
                } catch (err) {
                    if (!isMounted.current) return; // Check mount status
                    console.error(`Error creating task for record ${record.id} ('${record.title}'):`, err.response?.data || err.message);
                    failedCreations.push(record.title);
                    // If the error is due to the task already existing (e.g., 400 Bad Request with specific message),
                    // we might want to handle it gracefully or fetch the existing task.
                    // For now, we just log it.
                    if (err.response?.status === 400 && err.response?.data?.title?.some(msg => msg.includes('already exists'))) {
                         console.warn(`Task '${record.title}' likely already existed (backend validation).`);
                    }
                }
            }
            
            // Update tasks state only if new tasks were successfully created
            if (createdTasksBatch.length > 0) {
                setTasks(prev => {
                    const newTasks = {...prev};
                    // Ensure 'todo' array exists
                    if (!newTasks['todo']) {
                        newTasks['todo'] = [];
                    }
                    // Append new tasks, filtering out any potential duplicates by ID just in case
                    const currentTodoIds = new Set(newTasks['todo'].map(t => t.id));
                    const uniqueNewTasks = createdTasksBatch.filter(t => !currentTodoIds.has(t.id));
                    newTasks['todo'] = [...newTasks['todo'], ...uniqueNewTasks];
                    return newTasks;
                });
                 console.log(`Added ${createdTasksBatch.length} new tasks to the UI.`);
            }
            if(failedCreations.length > 0) {
                 console.warn(`Failed to create tasks for: ${failedCreations.join(', ')}`);
                 // Optionally set an error state here
            }
            
        } catch (err) {
             if (!isMounted.current) return; // Check mount status
            console.error("Error in createTasksFromRecords:", err);
             setError("An error occurred while checking or creating tasks from records."); // Set component-level error
        } finally {
             if (isMounted.current) {
                 setIsCreatingTasks(false); // Reset flag in finally block
                 console.log("Finished createTasksFromRecords.");
             }
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    const findTask = (taskId) => {
        for (const status in tasks) {
            const task = tasks[status].find(t => t.id === taskId);
            if (task) {
                return { task, status };
            }
        }
        return null;
    };

    const calculateNewOrder = (items, overIndex) => {
        // Basic strategy: assign order based on index
        // More robust: fractional indexing or average between neighbors
        // For now, we'll just update the moved item's order based on its new index
        // The backend might need to handle potential collisions or re-ordering siblings
        return overIndex; // Simplistic - backend should handle collisions/reordering based on this intent
    };

    const handleDragStart = (event) => {
        const { active } = event;
        const result = findTask(active.id);
        if(result) {
             setActiveTask(result.task);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveTask(null); // Clear overlay task

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return; // Dropped on itself

        const activeTaskData = findTask(activeId);
        if (!activeTaskData) return;

        const { task: draggedTask, status: sourceColumn } = activeTaskData;

        // Determine the target column and target task (if dropped onto a task)
        let targetColumn = over.data.current?.sortable?.containerId; 
        let overTaskIndex = -1;
        
        if(targetColumn) { // Dropped onto a task within a SortableContext
             // Calculate index relative to the tasks *currently* in the target column
             const targetTasks = tasks[targetColumn] || [];
             overTaskIndex = targetTasks.findIndex(t => t.id === overId);
        } else if (tasks[overId]) { // Dropped directly onto a column (useDroppable id)
            targetColumn = overId;
            overTaskIndex = (tasks[targetColumn] || []).length; // Append to end if dropped on column directly
        } else { 
             // Attempt to find the target column based on overId being a task ID
             const overTaskData = findTask(overId);
             if(overTaskData) {
                 targetColumn = overTaskData.status;
                 // Calculate index relative to the tasks *currently* in the target column
                 const targetTasks = tasks[targetColumn] || [];
                 overTaskIndex = targetTasks.findIndex(t => t.id === overId);
             } else {
                 console.warn("Cannot determine drop target.");
                 return; // Exit if target isn't clear
             }
        }
        
        // If the target wasn't found correctly, default to the end
        if (overTaskIndex === -1) {
             console.warn(`Could not find overId ${overId} in target column ${targetColumn}. Appending to end.`);
             overTaskIndex = (tasks[targetColumn] || []).length; 
        }

        const newStatus = targetColumn;

        // --- Optimistic UI Update --- 
        let newTasksState = { ...tasks };
        let targetOrderIndex = 0; // This will be the index passed to the backend
        
        // Create a copy of the task being moved
        const movedTask = { ...draggedTask };
        
        // 1. Remove task from source column's array
        const sourceTasks = (newTasksState[sourceColumn] || []).filter(t => t.id !== activeId);
        newTasksState[sourceColumn] = sourceTasks;
        
        // 2. Prepare target column's array
        let targetTasks = [...(newTasksState[targetColumn] || [])];

        if (sourceColumn === targetColumn) {
            // Reordering within the same column
            const originalIndex = tasks[sourceColumn].findIndex(t => t.id === activeId);
            targetOrderIndex = overTaskIndex > originalIndex ? overTaskIndex : overTaskIndex; // Adjust index for removal
            
            // Use arrayMove for stable reordering in the UI state
            // Note: arrayMove needs the *original* array before filtering
            const originalTargetTasks = tasks[targetColumn] || [];
            const movedIndex = originalTargetTasks.findIndex(t => t.id === activeId);
            if (movedIndex !== -1) {
                 targetTasks = arrayMove(originalTargetTasks, movedIndex, overTaskIndex);
            } else {
                 console.error("Could not find moved task in original array for arrayMove");
                 // Fallback: insert manually (less ideal for animation smoothness)
                 targetTasks.splice(overTaskIndex, 0, movedTask);
            }
            
        } else {
            // Moving to a different column
            targetOrderIndex = overTaskIndex;
            targetTasks.splice(targetOrderIndex, 0, { ...movedTask, status: newStatus });
        }
        
        newTasksState[targetColumn] = targetTasks;
        
        // Update the UI optimistically
        setTasks(newTasksState);
        // Clear any previous errors immediately for smoother transition
        setError(null);

        // Log the data being sent - Ensure 'order' represents the target index
        console.log(`Updating task ${activeId}:`, { status: newStatus, order: targetOrderIndex });

        // --- Update Backend --- 
        axios.patch(`${API_URL}/api/tasks/${activeId}/`, { status: newStatus, order: targetOrderIndex })
            .then(response => {
                console.log(`Task ${activeId} updated successfully in backend`, response.data);
                // Backend response might contain the definitive state (e.g., recalculated order)
                // It's often good practice to update the frontend state again based on the backend response
                // to ensure full consistency, though the optimistic update handles the immediate visual.
                // Example: Refetch tasks or merge response.data into the state.
                // For now, we assume the optimistic update + backend logic is sufficient.
            })
            .catch(err => {
                // Log the error, but avoid jarring UI changes like immediate error messages or reverts.
                // The backend holds the source of truth. If it failed, the UI might be temporarily 
                // inconsistent until the next refresh or successful update.
                console.error(`Error updating task ${activeId} in backend:`, err.response?.data || err.message);
                // Optionally set a *non-blocking* error state or use a notification system
                // setError('Failed to save task change. Please refresh or try again.'); 
                // Avoid reverting the optimistic update here to keep the UI smooth.
                // If persistent errors occur, a full refresh might be needed.
            });
    };

    // --- Modal Handling ---
    const handleOpenEditModal = (taskToEdit) => {
        setEditingTask(taskToEdit);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingTask(null);
    };

    // --- Handle Update Task ---
    const handleUpdateTask = (taskId, updatedData) => {
        const currentTaskData = findTask(taskId);
        if (!currentTaskData) return;
        const { status: currentStatus } = currentTaskData;

        // Optimistic UI Update
        const updatedTask = { ...editingTask, ...updatedData };
        setTasks(prev => ({
            ...prev,
            [currentStatus]: prev[currentStatus].map(task => 
                task.id === taskId ? updatedTask : task
            )
        }));
        
        handleCloseEditModal(); // Close modal immediately
        setError(null);

        // API Call
        axios.patch(`${API_URL}/api/tasks/${taskId}/`, updatedData)
            .then(response => {
                console.log(`Task ${taskId} updated successfully:`, response.data);
                // Update state again with potentially more complete data from backend if needed
                setTasks(prev => ({
                    ...prev,
                    [currentStatus]: prev[currentStatus].map(task => 
                        task.id === taskId ? response.data : task
                    )
                }));
            })
            .catch(err => {
                console.error(`Error updating task ${taskId}:`, err);
                setError('Failed to save task changes. Please try again.');
                // Revert optimistic update
                setTasks(prev => ({
                    ...prev,
                    [currentStatus]: prev[currentStatus].map(task => 
                        task.id === taskId ? editingTask : task // Restore original editingTask data
                    )
                }));
            });
    };

    if (loading) return <div className="text-center p-4">Loading data for {profile.name}...</div>;
    if (error) return <div className="text-center p-4 text-red-500">{error}</div>;
    if (!tasks || Object.values(tasks).every(list => list.length === 0)) return (
        <div className="profile-board bg-gray-100 p-4 rounded-lg shadow-lg min-h-[200px]">
            <h2 className="text-xl font-source-sans-pro mb-4">{profile.name}</h2>
            <p className="text-gray-500 font-source-sans-pro">No tasks found for this profile.</p>
        </div>
    );

    // Function to get all task IDs for SortableContext
    const getAllTaskIds = () => {
        let ids = [];
        Object.values(tasks).forEach(taskList => {
            if(taskList) {
                ids = ids.concat(taskList.map(task => task.id));
            }
        });
        return ids;
    };

    return (
        <div className="profile-board bg-gray-100 p-4 rounded-lg shadow-lg min-h-[300px]">
            <h2 className="text-xl font-bold font-source-sans-pro mb-4 text-gray-800">{profile.name}'s Board</h2>
            <DndContext 
                sensors={sensors} 
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd} 
            >
                {/* Pass all task IDs from all columns */}
                <SortableContext items={getAllTaskIds()} strategy={verticalListSortingStrategy}>
                    <div className="kanban-columns grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(COLUMNS).map(([statusKey, statusValue]) => (
                            <KanbanColumn 
                                key={statusKey} 
                                id={statusKey} 
                                title={statusValue}
                                tasks={tasks[statusKey] || []} 
                                onEditTask={handleOpenEditModal} // Pass edit handler
                            />
                        ))}
                    </div>
                </SortableContext>
                 {/* Optional Drag Overlay */}
                 <DragOverlay>
                    {activeTask ? <KanbanTask task={activeTask} /> : null}
                </DragOverlay>
            </DndContext>
             {/* Edit Task Modal */}
             <EditTaskModal 
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                task={editingTask}
                onSave={handleUpdateTask}
             />
        </div>
    );
}

// Wrap the export with React.memo
export default memo(ProfileKanbanBoard); 