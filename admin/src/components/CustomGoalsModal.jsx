import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

const CustomGoalsModal = ({ isOpen, onClose, onSave, initialGoals }) => {
  const [goals, setGoals] = useState({
    macronutrients: {
      calories: 2000,
      protein: 50,
      carbs: 250,
      fat: 65,
      fiber: 25
    },
    vitamins: {
      vitamin_a: 700,
      vitamin_b1: 1.1,
      vitamin_b2: 1.1,
      vitamin_b3: 14,
      vitamin_b6: 1.3,
      vitamin_b12: 2.4,
      vitamin_c: 75,
      vitamin_d: 15,
      vitamin_e: 15,
      vitamin_k: 90,
      folate: 400
    },
    minerals: {
      calcium: 1000,
      iron: 10,
      magnesium: 310,
      phosphorus: 700,
      potassium: 2600,
      sodium: 1500,
      zinc: 8
    }
  });

  useEffect(() => {
    if (initialGoals) {
      setGoals(initialGoals);
    }
  }, [initialGoals]);

  if (!isOpen) return null;

  const handleMacroChange = (key, value) => {
    setGoals(prev => ({
      ...prev,
      macronutrients: {
        ...prev.macronutrients,
        [key]: parseFloat(value) || 0
      }
    }));
  };

  const handleVitaminChange = (key, value) => {
    setGoals(prev => ({
      ...prev,
      vitamins: {
        ...prev.vitamins,
        [key]: parseFloat(value) || 0
      }
    }));
  };

  const handleMineralChange = (key, value) => {
    setGoals(prev => ({
      ...prev,
      minerals: {
        ...prev.minerals,
        [key]: parseFloat(value) || 0
      }
    }));
  };

  const handleSave = () => {
    onSave(goals);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Custom Nutrition Goals</h2>
              <p className="text-sm text-gray-600 mt-0.5">Set personalized daily nutrition targets for the patient</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Macronutrients Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <h3 className="text-base font-semibold text-gray-800">Macronutrients</h3>
            </div>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Calories<br />(kcal)
                </label>
                <input
                  type="number"
                  value={goals.macronutrients.calories}
                  onChange={(e) => handleMacroChange('calories', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-base font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Protein<br />(g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.macronutrients.protein}
                  onChange={(e) => handleMacroChange('protein', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Carbs<br />(g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.macronutrients.carbs}
                  onChange={(e) => handleMacroChange('carbs', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fat<br />(g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.macronutrients.fat}
                  onChange={(e) => handleMacroChange('fat', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fiber<br />(g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.macronutrients.fiber}
                  onChange={(e) => handleMacroChange('fiber', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
            </div>
          </div>

          {/* Vitamins Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-base font-semibold text-gray-800">Vitamins</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vitamin A<br />(mcg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.vitamins.vitamin_a}
                  onChange={(e) => handleVitaminChange('vitamin_a', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vitamin B1<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.vitamins.vitamin_b1}
                  onChange={(e) => handleVitaminChange('vitamin_b1', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vitamin B2<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.vitamins.vitamin_b2}
                  onChange={(e) => handleVitaminChange('vitamin_b2', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vitamin B3<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.vitamins.vitamin_b3}
                  onChange={(e) => handleVitaminChange('vitamin_b3', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vitamin B6<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.vitamins.vitamin_b6}
                  onChange={(e) => handleVitaminChange('vitamin_b6', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vitamin B12<br />(mcg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.vitamins.vitamin_b12}
                  onChange={(e) => handleVitaminChange('vitamin_b12', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vitamin C<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.vitamins.vitamin_c}
                  onChange={(e) => handleVitaminChange('vitamin_c', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vitamin D<br />(mcg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.vitamins.vitamin_d}
                  onChange={(e) => handleVitaminChange('vitamin_d', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vitamin E<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.vitamins.vitamin_e}
                  onChange={(e) => handleVitaminChange('vitamin_e', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vitamin K<br />(mcg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.vitamins.vitamin_k}
                  onChange={(e) => handleVitaminChange('vitamin_k', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Folate<br />(mcg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.vitamins.folate}
                  onChange={(e) => handleVitaminChange('folate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
            </div>
          </div>

          {/* Minerals Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-base font-semibold text-gray-800">Minerals</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Calcium<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.minerals.calcium}
                  onChange={(e) => handleMineralChange('calcium', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Iron<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.minerals.iron}
                  onChange={(e) => handleMineralChange('iron', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Magnesium<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.minerals.magnesium}
                  onChange={(e) => handleMineralChange('magnesium', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phosphorus<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.minerals.phosphorus}
                  onChange={(e) => handleMineralChange('phosphorus', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Potassium<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.minerals.potassium}
                  onChange={(e) => handleMineralChange('potassium', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sodium<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.minerals.sodium}
                  onChange={(e) => handleMineralChange('sodium', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Zinc<br />(mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goals.minerals.zinc}
                  onChange={(e) => handleMineralChange('zinc', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Custom Goals
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomGoalsModal;
