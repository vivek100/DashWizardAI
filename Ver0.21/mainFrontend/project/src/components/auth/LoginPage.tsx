import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  BarChart3, 
  Database, 
  Zap, 
  MessageSquare,
  Palette,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  PieChart,
  LineChart,
  Activity,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Play
} from 'lucide-react';
import { useForm } from 'react-hook-form';

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithDemo, isLoading } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    await login(data.email, data.password);
    navigate('/');
  };

  const handleDemoLogin = async () => {
    try {
      await loginWithDemo();
      navigate('/');
    } catch (error) {
      console.error('Demo login failed:', error);
      // You might want to show an error message to the user here
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analytics',
      description: 'Ask questions in natural language and get instant dashboard insights',
      color: 'bg-blue-500'
    },
    {
      icon: Palette,
      title: 'No-Code Builder',
      description: 'Drag & drop interface to create stunning dashboards without coding',
      color: 'bg-purple-500'
    },
    {
      icon: Database,
      title: 'Smart Data Integration',
      description: 'Upload CSV files, run SQL queries, and create custom data views',
      color: 'bg-green-500'
    },
    {
      icon: Filter,
      title: 'Advanced Filtering',
      description: 'Dynamic filters, VLOOKUP functions, and computed formulas',
      color: 'bg-orange-500'
    }
  ];

  const dashboardExamples = [
    {
      title: 'Sales Performance',
      description: 'Revenue trends, conversion rates, and team metrics',
      icon: DollarSign,
      metrics: ['$2.4M Revenue', '23% Growth', '156 Deals'],
      color: 'from-green-400 to-green-600'
    },
    {
      title: 'Customer Analytics',
      description: 'User behavior, segments, and lifetime value',
      icon: Users,
      metrics: ['12.5K Users', '4.2 LTV', '85% Retention'],
      color: 'from-blue-400 to-blue-600'
    },
    {
      title: 'Marketing ROI',
      description: 'Campaign performance and attribution analysis',
      icon: Target,
      metrics: ['3.2x ROAS', '45% CTR', '28% Conv'],
      color: 'from-purple-400 to-purple-600'
    }
  ];

  const capabilities = [
    'Natural language queries',
    'Real-time data updates',
    'Custom visualizations',
    'Automated insights',
    'Team collaboration',
    'Export & sharing'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">DashboardAI</div>
            <div className="text-sm text-gray-500">Analytics Platform</div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            No-Code
          </Badge>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Hero Content - Left Side */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <Brain className="w-4 h-4 mr-2" />
                Powered by Advanced AI
              </div>
              
              <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                Build Beautiful Dashboards with
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {' '}AI Magic
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
                Transform your data into stunning, interactive dashboards using natural language. 
                No coding required – just describe what you want and watch AI build it instantly.
              </p>

              <div className="flex flex-wrap gap-3">
                {capabilities.map((capability, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm border">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">{capability}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
              <div className="text-center">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm opacity-90">Dashboards Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">50M+</div>
                <div className="text-sm opacity-90">Data Points Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-sm opacity-90">Uptime Guarantee</div>
              </div>
            </div>
          </div>

          {/* Login Form - Right Side */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold">Get Started</CardTitle>
                  <CardDescription>
                    Try our demo or sign in to your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Button
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12"
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Try Demo Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <div className="relative">
                    <Separator />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-4 text-xs text-gray-500 bg-white">Or sign in with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@company.com"
                        {...register('email', { required: 'Email is required' })}
                        className="h-11"
                      />
                      {errors.email && (
                        <p className="text-xs text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        {...register('password', { required: 'Password is required' })}
                        className="h-11"
                      />
                      {errors.password && (
                        <p className="text-xs text-red-600">{errors.password.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      size="lg"
                      variant="outline"
                      className="w-full h-11"
                    >
                      Sign In
                    </Button>
                  </form>

                  <div className="space-y-4">
                    <div className="text-center">
                      <Button variant="link" className="text-xs text-blue-600 hover:text-blue-700">
                        Forgot your password?
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 space-y-2">
                        <div className="font-medium">Demo Account Includes:</div>
                        <ul className="space-y-1">
                          <li className="flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                            Sample datasets & dashboards
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                            Full AI assistant access
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                            All premium features
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-xs text-gray-500">
                    By continuing, you agree to our{' '}
                    <Button variant="link" className="text-xs p-0 h-auto text-blue-600">
                      Terms of Service
                    </Button>
                    {' '}and{' '}
                    <Button variant="link" className="text-xs p-0 h-auto text-blue-600">
                      Privacy Policy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <div class="fixed bottom-4 right-4 z-50">
        <a href="https://bolt.new/?rid=os72mi" target="_blank" rel="noopener noreferrer" 
           class="block transition-all duration-300 hover:shadow-2xl">
          <img src="https://storage.bolt.army/white_circle_360x360.png" 
               alt="Built with Bolt.new badge" 
               class="w-20 h-20 md:w-28 md:h-28 rounded-full shadow-lg  "
                />
        </a>
      </div>
    </div>
  );
}