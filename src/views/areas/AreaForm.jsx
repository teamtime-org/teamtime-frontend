import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@/components/ui';
import { useAreas } from '@/hooks/useAreas';

const predefinedColors = [
  '#10B981', // Green
  '#3B82F6', // Blue
  '#F59E0B', // Orange
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange-600
  '#EC4899', // Pink
  '#6366F1', // Indigo
];

const AreaForm = ({ area, onSuccess, onCancel }) => {
  const { createArea, updateArea, loading } = useAreas();
  const [selectedColor, setSelectedColor] = useState(area?.color || predefinedColors[0]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      name: area?.name || '',
      description: area?.description || '',
      color: area?.color || predefinedColors[0],
    },
  });

  useEffect(() => {
    if (area) {
      reset({
        name: area.name,
        description: area.description,
        color: area.color,
      });
      setSelectedColor(area.color);
    }
  }, [area, reset]);

  const onSubmit = async (data) => {
    try {
      const areaData = {
        ...data,
        color: selectedColor,
      };

      if (area) {
        await updateArea(area.id, areaData);
      } else {
        await createArea(areaData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving area:', error);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setValue('color', color);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Area Name"
        required
        error={errors.name?.message}
        {...register('name', {
          required: 'Area name is required',
          minLength: {
            value: 2,
            message: 'Area name must be at least 2 characters',
          },
          maxLength: {
            value: 100,
            message: 'Area name must not exceed 100 characters',
          },
        })}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter area description..."
          {...register('description', {
            maxLength: {
              value: 500,
              message: 'Description must not exceed 500 characters',
            },
          })}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Area Color
        </label>
        <div className="flex items-center space-x-2 mb-4">
          <div
            className="w-8 h-8 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-sm text-gray-600">
            Selected: {selectedColor}
          </span>
        </div>
        
        <div className="grid grid-cols-5 gap-3">
          {predefinedColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorSelect(color)}
              className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-110 ${
                selectedColor === color
                  ? 'border-gray-900 ring-2 ring-gray-300'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Color
          </label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => handleColorSelect(e.target.value)}
            className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
        >
          {area ? 'Update Area' : 'Create Area'}
        </Button>
      </div>
    </form>
  );
};

export default AreaForm;