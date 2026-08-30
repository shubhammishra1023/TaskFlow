import React from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { Task } from '../types';
import { TaskItem } from './TaskItem';

interface ReorderableTaskItemProps {
  task: Task;
  isSelected?: boolean;
  onSelect?: (task: Task) => void;
  onToggle: (taskId: string, completed: boolean) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onEdit: (task: Task) => void;
  isDragEnabled?: boolean;
}

export const ReorderableTaskItem: React.FC<ReorderableTaskItemProps> = ({
  task,
  isSelected,
  onSelect,
  onToggle,
  onDelete,
  onEdit,
  isDragEnabled = true,
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={task}
      id={task.id}
      dragListener={false}
      dragControls={dragControls}
      className="list-none select-none relative"
      whileDrag={{
        scale: 1.015,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
        zIndex: 50,
      }}
      transition={{ duration: 0.12 }}
    >
      <TaskItem
        task={task}
        isSelected={isSelected}
        onSelect={onSelect}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
        isDragEnabled={isDragEnabled}
        onDragStart={(e) => {
          if (isDragEnabled) {
            dragControls.start(e);
          }
        }}
      />
    </Reorder.Item>
  );
};

