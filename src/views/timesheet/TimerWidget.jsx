import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  Modal,
  Badge
} from '@/components/ui';
import { useTimer } from '@/hooks/useTimesheets';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { formatDuration } from '@/utils';

const TimerWidget = () => {
  const { currentTimer, startTimer, stopTimer, updateTimer } = useTimer();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTaskSelect, setShowTaskSelect] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [description, setDescription] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval;
    if (currentTimer) {
      interval = setInterval(() => {
        const startTime = new Date(currentTimer.startTime);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentTimer]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async () => {
    if (!selectedTask) {
      setShowTaskSelect(true);
      return;
    }

    try {
      await startTimer(selectedTask, description);
      setShowTaskSelect(false);
      setDescription('');
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTimer();
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  const handleUpdateDescription = async () => {
    if (currentTimer && description !== currentTimer.description) {
      try {
        await updateTimer(currentTimer.id, { description });
      } catch (error) {
        console.error('Error updating timer:', error);
      }
    }
  };

  const getTaskDetails = (taskId) => {
    const task = tasks?.find(t => t.id === taskId);
    if (!task) return null;
    
    const project = projects?.find(p => p.id === task.projectId);
    return { task, project };
  };

  const currentTaskDetails = currentTimer ? getTaskDetails(currentTimer.taskId) : null;

  // Compact view when not expanded
  if (!isExpanded) {
    return (
      <div className="flex items-center space-x-2">
        {currentTimer ? (
          <Badge variant="success" className="flex items-center space-x-2 px-3 py-1">
            <Clock className="h-3 w-3" />
            <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
          </Badge>
        ) : (
          <Badge variant="secondary" className="flex items-center space-x-2 px-3 py-1">
            <Clock className="h-3 w-3" />
            <span className="text-sm">Stopped</span>
          </Badge>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card className="w-80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Timer</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>

          {currentTimer ? (
            <div className="space-y-4">
              {/* Current Timer Display */}
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-gray-900 mb-2">
                  {formatTime(elapsedTime)}
                </div>
                
                {currentTaskDetails && (
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">{currentTaskDetails.task.title}</div>
                    <div className="text-xs">{currentTaskDetails.project?.name}</div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <textarea
                  value={currentTimer.description || ''}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleUpdateDescription}
                  placeholder="What are you working on?"
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 resize-none"
                  rows="2"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  onClick={handleStopTimer}
                  className="flex items-center space-x-2"
                >
                  <Square className="h-4 w-4" />
                  <span>Stop</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stopped State */}
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-gray-400 mb-2">
                  00:00:00
                </div>
                <div className="text-sm text-gray-500">Timer stopped</div>
              </div>

              {/* Start Button */}
              <div className="flex items-center justify-center">
                <Button
                  onClick={() => setShowTaskSelect(true)}
                  className="flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Start Timer</span>
                </Button>
              </div>

              {/* Recent Tasks */}
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">Recent Tasks</div>
                <div className="space-y-1">
                  {tasks?.slice(0, 3).map(task => {
                    const project = projects?.find(p => p.id === task.projectId);
                    return (
                      <button
                        key={task.id}
                        onClick={() => {
                          setSelectedTask(task.id);
                          handleStartTimer();
                        }}
                        className="w-full text-left text-xs p-2 hover:bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="font-medium">{task.title}</div>
                        <div className="text-gray-500">{project?.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Selection Modal */}
      {showTaskSelect && (
        <Modal
          isOpen={showTaskSelect}
          onClose={() => setShowTaskSelect(false)}
          title="Start Timer"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Task
              </label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a task...</option>
                {projects?.map(project => (
                  <optgroup key={project.id} label={project.name}>
                    {tasks?.filter(task => task.projectId === project.id).map(task => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will you be working on?"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowTaskSelect(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartTimer}
                disabled={!selectedTask}
                className="flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Start Timer</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default TimerWidget;