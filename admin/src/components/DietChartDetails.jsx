import { X, Edit, Download, Share2, Clock } from 'lucide-react';
import PropTypes from 'prop-types';

const DietChartDetails = ({ chart, isOpen, onClose, onEdit }) => {
  if (!isOpen || !chart) return null;

  const nutritionData = [
    { name: 'Calories', current: 323, target: 2000, percentage: 16, color: 'bg-gray-900' },
    { name: 'Protein', current: 14, target: 46, unit: 'g', percentage: 30, color: 'bg-gray-900' },
    { name: 'Carbs', current: 64.6, target: 130, unit: 'g', percentage: 50, color: 'bg-gray-900' },
    { name: 'Fat', current: 1.3, target: 65, unit: 'g', percentage: 2, color: 'bg-gray-900' },
    { name: 'Fiber', current: 4.8, target: 25, unit: 'g', percentage: 19, color: 'bg-gray-900' },
    { name: 'Calcium', current: 141, target: 1000, unit: 'mg', percentage: 14, color: 'bg-gray-900' },
  ];

  const mealPlan = [
    {
      name: 'Breakfast',
      calories: 105,
      items: [
        {
          name: 'Moong Dal (cooked)',
          quantity: '100g',
          calories: 105,
          description: 'Light, easily digestible lentil, excellent for all constitutions',
          effects: ['Balances all doshas']
        }
      ]
    },
    {
      name: 'Mid-Morning',
      calories: 0,
      items: []
    },
    {
      name: 'Lunch',
      calories: 195,
      items: [
        {
          name: 'Basmati Rice (cooked)',
          quantity: '150g',
          calories: 195,
          description: 'Aromatic long-grain rice, cooling and easy to digest',
          effects: ['Balances Pitta', 'Increases Kapha']
        }
      ]
    },
    {
      name: 'Evening Snack',
      calories: 0,
      items: []
    },
    {
      name: 'Dinner',
      calories: 23,
      items: [
        {
          name: 'Spinach (cooked)',
          quantity: '100g',
          calories: 23,
          description: 'Iron-rich leafy green, excellent for blood building',
          effects: ['Reduces Pitta', 'Increases Vata', 'Balances Kapha']
        }
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-50 rounded-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
              <span className="font-medium">Back to List</span>
            </button>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(chart.status)}`}>
                {chart.status}
              </span>
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span className="font-medium">Edit Chart</span>
              </button>
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{chart.patientName}&apos;s Diet Chart</h1>
            <p className="text-gray-600 text-sm">Created on {chart.created}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Patient Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Patient Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Basic Information</h3>
                <div className="space-y-2">
                  <p className="text-gray-900"><span className="font-medium">Age:</span> {chart.age} years</p>
                  <p className="text-gray-900"><span className="font-medium">Gender:</span> {chart.gender}</p>
                  <p className="text-gray-900"><span className="font-medium">Constitution:</span> {chart.constitution.replace(' Constitution', '')}</p>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Primary Condition</h3>
                  <p className="text-gray-900 font-medium">{chart.primaryCondition}</p>
                </div>
              </div>

              {/* Current Symptoms */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Current Symptoms</h3>
                <p className="text-gray-900">Bloating, irregular appetite</p>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Allergies</h3>
                  <p className="text-gray-900">None</p>
                </div>
              </div>

              {/* Health Goals & Treatment Tags */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Health Goals</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                    Digestive Health
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                    Energy Boost
                  </span>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Treatment Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {chart.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nutrition and Meal Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Nutrition Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Nutrition Analysis</h2>
              
              <div className="space-y-6">
                {nutritionData.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="text-gray-600">
                        {item.current}{item.unit || 'kcal'} / {item.target}{item.unit || 'kcal'}
                      </span>
                    </div>
                    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute h-full ${item.color} rounded-full`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{item.percentage}% of target</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Meal Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Meal Distribution</h2>
              
              <div className="space-y-4">
                {mealPlan.map((meal, index) => (
                  <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{meal.name}</h3>
                      <span className="text-gray-600">{meal.calories} cal</span>
                    </div>
                    {meal.items.length > 0 ? (
                      <div className="space-y-1">
                        {meal.items.map((item, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            • {item.name} ({item.quantity})
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No foods assigned</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Complete Diet Plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Complete Diet Plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mealPlan.map((meal, index) => (
                <div key={index}>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">{meal.name}</h3>
                  </div>
                  
                  {meal.items.length > 0 ? (
                    <div className="space-y-4">
                      {meal.items.map((item, idx) => (
                        <div key={idx} className="border-l-4 border-gray-200 pl-4">
                          <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                          <p className="text-sm text-gray-600 mb-1">
                            {item.quantity} • {item.calories} calories
                          </p>
                          <p className="text-sm text-gray-500 mb-2 italic">{item.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {item.effects.map((effect, effectIdx) => (
                              <span
                                key={effectIdx}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                              >
                                {effect}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No foods selected for this meal</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Treatment Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Treatment Notes</h2>
            <p className="text-gray-700">
              Patient responding well to the warm, cooked foods. Continue for 2 more weeks.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              <Share2 className="w-4 h-4" />
              Share Chart
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit Chart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

DietChartDetails.propTypes = {
  chart: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

export default DietChartDetails;
