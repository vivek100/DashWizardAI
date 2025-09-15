import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '@/store/dashboardStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  BarChart3, 
  Eye, 
  Edit, 
  Copy, 
  Star,
  Calendar,
  Users,
  TrendingUp,
  Share,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function DashboardsPage() {
  const navigate = useNavigate();
  const { dashboards, templates, createDashboard, deleteDashboard } = useDashboardStore();

  const handleCreateDashboard = () => {
    navigate('/dashboards/edit/new');
  };

  const handleUseTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const newDashboard = createDashboard(
        `${template.name} Copy`,
        `Created from ${template.name} template`
      );
      navigate(`/dashboards/edit/${newDashboard.id}`);
    }
  };

  const handleViewDashboard = (id: string) => {
    navigate(`/dashboards/view/${id}`);
  };

  const handleEditDashboard = (id: string) => {
    navigate(`/dashboards/edit/${id}`);
  };

  const handleCopyDashboard = (dashboard: any) => {
    const newDashboard = createDashboard(
      `${dashboard.name} Copy`,
      dashboard.description
    );
    toast.success('Dashboard copied successfully');
  };

  const handleDeleteDashboard = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteDashboard(id);
      toast.success('Dashboard deleted successfully');
    }
  };

  const handleShareDashboard = (id: string) => {
    const url = `${window.location.origin}/dashboards/view/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Dashboard link copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboards</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create, manage, and share your analytics dashboards
          </p>
        </div>
        <Button onClick={handleCreateDashboard} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Dashboard
        </Button>
      </div>

      <Tabs defaultValue="published" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Published Dashboards */}
        <TabsContent value="published" className="space-y-4">
          {dashboards.filter(d => d.isPublished).length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <CardTitle className="text-lg mb-2">No published dashboards</CardTitle>
                <CardDescription className="mb-4">
                  Create your first dashboard to start visualizing your data
                </CardDescription>
                <Button onClick={handleCreateDashboard}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.filter(d => d.isPublished).map((dashboard) => (
                <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{dashboard.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {dashboard.description}
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="text-xs">
                        Published
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(dashboard.updatedAt, 'MMM d')}
                        </div>
                        <div className="flex items-center">
                          <BarChart3 className="w-3 h-3 mr-1" />
                          {dashboard.widgets.length} widgets
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleViewDashboard(dashboard.id)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleEditDashboard(dashboard.id)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleShareDashboard(dashboard.id)}
                        >
                          <Share className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleCopyDashboard(dashboard)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Draft Dashboards */}
        <TabsContent value="drafts" className="space-y-4">
          {dashboards.filter(d => !d.isPublished).length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <CardDescription>No draft dashboards found</CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.filter(d => !d.isPublished).map((dashboard) => (
                <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{dashboard.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {dashboard.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Draft
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(dashboard.updatedAt, 'MMM d')}
                        </div>
                        <div className="flex items-center">
                          <BarChart3 className="w-3 h-3 mr-1" />
                          {dashboard.widgets.length} widgets
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleEditDashboard(dashboard.id)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Continue
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleCopyDashboard(dashboard)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteDashboard(dashboard.id, dashboard.name)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Analytics
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {template.widgets.length} pre-built widgets
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-8 text-xs"
                      onClick={() => handleUseTemplate(template.id)}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}