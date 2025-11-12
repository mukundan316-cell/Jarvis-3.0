import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Upload, FileText, Calendar, Building2 } from 'lucide-react';
import { CPBaseCard } from './CPBaseCard';
import { CPDataRow } from './CPDataRow';
import { CPActionButtonGroup } from './CPActionButtons';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Commercial Property Email Intake schema
const cpEmailIntakeSchema = z.object({
  brokerEmail: z.string().email('Please enter a valid email address'),
  insuredBusinessName: z.string().min(1, 'Business name is required'),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  coverageLines: z.string().min(1, 'Coverage lines are required'),
  propertyDetails: z.string().optional(),
});

type CPEmailIntakeForm = z.infer<typeof cpEmailIntakeSchema>;

interface CPEmailIntakeProps {
  onSubmit: (data: CPEmailIntakeForm & { attachments: File[] }) => void;
  onCancel?: () => void;
  initialData?: Partial<CPEmailIntakeForm>;
}

/**
 * Modern Commercial Property Email Intake & Submission Capture component
 * Uses unified CP design system for consistent styling
 */
export function CPEmailIntake({ onSubmit, onCancel, initialData }: CPEmailIntakeProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const form = useForm<CPEmailIntakeForm>({
    resolver: zodResolver(cpEmailIntakeSchema),
    defaultValues: {
      brokerEmail: '',
      insuredBusinessName: '',
      effectiveDate: '',
      coverageLines: '',
      propertyDetails: '',
      ...initialData
    }
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (data: CPEmailIntakeForm) => {
    onSubmit({ ...data, attachments });
  };

  return (
    <CPBaseCard 
      icon={Mail} 
      title="Email Intake & Submission Capture"
      iconColor="text-blue-400"
    >
      <div className="text-slate-300 text-sm mb-4">
        Capture broker email details and ACORD attachments for commercial property submission processing
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="brokerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Broker Email</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="broker@agency.com"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insuredBusinessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Insured Business Name</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="ABC Manufacturing Corp"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="effectiveDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Requested Effective Date</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="dd-mm-yyyy"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverageLines"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Coverage Lines Requested</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Property, General Liability, Workers Compensation..."
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 min-h-[60px]"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          {/* Document Upload Section */}
          <div className="space-y-3">
            <FormLabel className="text-slate-300">ACORD Forms (125/140)</FormLabel>
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-500/10' 
                  : 'border-slate-600 bg-slate-700/30'
              }`}
              data-testid="file-drop-zone"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-300 font-medium">Drop ACORD forms here or</p>
                <p className="text-slate-400 text-sm mb-3">PDF, DOC, XLS files supported</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Choose Files
                </label>
              </div>
            </div>

            {/* File List */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <FormLabel className="text-slate-300">Uploaded Files</FormLabel>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-700/50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-sm">{file.name}</span>
                      <span className="text-slate-400 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <CPActionButtonGroup
            buttons={[
              {
                label: "Process Submission",
                onClick: () => form.handleSubmit(handleFormSubmit)(),
                variant: "primary"
              },
              ...(onCancel ? [{
                label: "Cancel",
                onClick: onCancel,
                variant: "secondary" as const
              }] : [])
            ]}
          />
        </form>
      </Form>
    </CPBaseCard>
  );
}