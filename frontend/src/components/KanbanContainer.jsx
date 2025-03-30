import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProfileKanbanBoard from './ProfileKanbanBoard';
import { 
    DndContext, 
    closestCenter, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors 
} from '@dnd-kit/core';
import { 
    arrayMove, 
    SortableContext, 
    sortableKeyboardCoordinates,
    rectSortingStrategy // Use a strategy suitable for grids/wrapping items
} from '@dnd-kit/sortable';
import SortableBoardItem from './SortableBoardItem'; // We will create this next

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function KanbanContainer() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`${API_URL}/api/profiles/`)
            .then(response => {
                // Assuming profiles don't have an 'order' field from backend yet
                setProfiles(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching profiles:", err);
                setError('Failed to load profiles.');
                setLoading(false);
            });
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleBoardDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setProfiles((items) => {
                const oldIndex = items.findIndex(p => p.id === active.id);
                const newIndex = items.findIndex(p => p.id === over.id);
                // Note: This order is only stored in frontend state
                return arrayMove(items, oldIndex, newIndex);
            });
             // TODO: Add API call here if/when backend supports profile ordering
             // Example: axios.post(`${API_URL}/api/profiles/reorder/`, { orderedIds: newProfileOrder.map(p=>p.id) });
        }
    };

    if (loading) return <div className="text-center p-4">Loading Kanban boards...</div>;
    if (error) return <div className="text-center p-4 text-red-500">{error}</div>;
    if (profiles.length === 0) return <div className="text-center p-4">No profiles found. Add a profile to create a Kanban board.</div>;

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleBoardDragEnd}
        >
            {/* Use profile IDs for sortable items */}
            <SortableContext items={profiles.map(p => p.id)} strategy={rectSortingStrategy}>
                <div className="kanban-container p-4 flex flex-wrap gap-4 justify-center items-start">
                    {profiles.map(profile => (
                        <SortableBoardItem key={profile.id} id={profile.id}>
                           <ProfileKanbanBoard profile={profile} />
                        </SortableBoardItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

export default KanbanContainer; 