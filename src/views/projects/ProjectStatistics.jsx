import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle, 
  Calendar,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Loading } from '@/components/ui';
import { formatDuration, formatDate } from '@/utils';

const ProjectStatistics = ({ project, onClose }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock function - replace with actual API call
  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // This would be a real API call to get project statistics
      // For now, we'll calculate from available data and add mock data
      const mockStats = {
        totalTasks: project._count?.tasks || 0,
        completedTasks: project._count?.completedTasks || 0,
        totalTimeLogged: 145.5, // hours
        estimatedTime: project.estimatedHours || 0,
        teamMembers: project.assignments?.length || 0,
        weeklyProgress: [
          { week: 'Week 1', completed: 2, total: 8 },
          { week: 'Week 2', completed: 5, total: 8 },
          { week: 'Week 3', completed: 7, total: 8 },
          { week: 'Week 4', completed: 8, total: 8 },
        ],
        tasksByStatus: {
          todo: 5,
          inProgress: 3,
          review: 2,
          done: project._count?.completedTasks || 0,
        },
        timeByMember: [
          { name: 'Ana García', hours: 45.5 },
          { name: 'Luis Martínez', hours: 38.2 },
          { name: 'María López', hours: 32.8 },
          { name: 'Carlos Ruiz', hours: 29.0 },
        ],
      };
      setStatistics(mockStats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [project.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load project statistics.</p>
      </div>
    );
  }

  const progressPercentage = statistics.totalTasks > 0 
    ? Math.round((statistics.completedTasks / statistics.totalTasks) * 100) 
    : 0;

  const timeEfficiency = statistics.estimatedTime > 0 
    ? Math.round((statistics.totalTimeLogged / statistics.estimatedTime) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-xl font-bold">{progressPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tasks</p>
                <p className="text-xl font-bold">
                  {statistics.completedTasks}/{statistics.totalTasks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Logged</p>
                <p className="text-xl font-bold">{formatDuration(statistics.totalTimeLogged)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Team Size</p>
                <p className="text-xl font-bold">{statistics.teamMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Time Logged</span>
                  <span>{formatDuration(statistics.totalTimeLogged)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Estimated Time</span>
                  <span>{formatDuration(statistics.estimatedTime)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      timeEfficiency <= 100 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(timeEfficiency, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Efficiency: {timeEfficiency}%
                  {timeEfficiency > 100 && ' (Over budget)'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Task Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statistics.tasksByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'done' ? 'bg-green-500' :
                      status === 'inProgress' ? 'bg-blue-500' :
                      status === 'review' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm capitalize">{status.replace(/([A-Z])/g, ' $1')}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statistics.weeklyProgress.map((week) => {
              const weekProgress = Math.round((week.completed / week.total) * 100);
              return (
                <div key={week.week}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{week.week}</span>
                    <span>{week.completed}/{week.total} tasks</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${weekProgress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time by Team Member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Time by Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statistics.timeByMember.map((member) => (
              <div key={member.name} className="flex items-center justify-between">
                <span className="text-sm">{member.name}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ 
                        width: `${Math.min((member.hours / Math.max(...statistics.timeByMember.map(m => m.hours))) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {formatDuration(member.hours)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">Start Date</p>
                <p className="text-sm text-gray-600">{formatDate(project.startDate)}</p>
              </div>
              <div>
                <p className="font-medium">End Date</p>
                <p className="text-sm text-gray-600">{formatDate(project.endDate)}</p>
              </div>
            </div>
            
            <div>
              <p className="font-medium mb-2">Project Timeline</p>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Started</span>
                  <span>{progressPercentage}% Complete</span>
                  <span>Target</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectStatistics;