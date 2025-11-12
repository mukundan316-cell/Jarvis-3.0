import { OpenAI } from 'openai';
import { ConfigService } from '../configService';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Azure OpenAI Service Wrapper
 * Provides document processing and natural language capabilities using Azure OpenAI GPT-4
 * Following replit.md principles: NO HARD-CODING, secure configuration, proper error handling
 */

export interface DocumentAnalysisResult {
  extractedData: {
    propertyDetails?: {
      insuredName?: string;
      businessType?: string;
      propertyAddress?: string;
      buildingValue?: number;
      contentsValue?: number;
      businessInterruptionValue?: number;
    };
    coverageDetails?: {
      effectiveDate?: string;
      expirationDate?: string;
      linesOfBusiness?: string[];
      policyLimits?: {
        building?: number;
        contents?: number;
        businessInterruption?: number;
      };
    };
    riskDetails?: {
      constructionType?: string;
      occupancy?: string;
      protectionClass?: string;
      yearBuilt?: number;
    };
  };
  confidence: number;
  documentType: string;
  processingMethod: 'openai' | 'keyword_fallback';
  rawResponse?: any;
  errors?: string[];
}

export interface CommandParseResult {
  intent: string;
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  conversationContext?: string[];
}

export class OpenAIService {
  private client: OpenAI | null = null;
  private isInitialized = false;
  private fallbackEnabled = true;

  /**
   * Initialize the Azure OpenAI client using ConfigService settings
   * Follows NO-HARDCODING principle by retrieving configuration from database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.client) {
      return;
    }

    try {
      // Get Azure OpenAI configuration from environment variables (secure)
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

      if (!apiKey || !endpoint || !deployment) {
        console.warn('⚠️ OpenAI Service: Missing Azure OpenAI credentials, fallback mode enabled');
        this.fallbackEnabled = true;
        return;
      }

      // Initialize Azure OpenAI client with updated API version
      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: `${endpoint}/openai/deployments/${deployment}`,
        defaultQuery: { 'api-version': '2024-06-01' },
        defaultHeaders: {
          'api-key': apiKey,
        },
      });

      // Skip connection test during initialization to avoid startup delays
      this.isInitialized = true;
      this.fallbackEnabled = false;

      console.log('✅ OpenAI Service initialized successfully');

    } catch (error) {
      console.error('❌ OpenAI Service initialization failed:', error);
      this.fallbackEnabled = true;
    }
  }

  /**
   * Test Azure OpenAI connection
   */
  private async testConnection(): Promise<void> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    const response = await this.client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: [{ role: 'user', content: 'Test connection' }],
      max_tokens: 5,
      temperature: 0.1
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error('Invalid response from Azure OpenAI');
    }
  }

  /**
   * Analyze ACORD 125 Commercial Property Application forms with Vision API
   * Handles both image files (JPG, PNG) and PDF documents
   * @param documentInput - File buffer, base64 string, or text content
   * @param inputType - 'file', 'base64', or 'text'
   * @param documentType - Document type identifier
   */
  async analyzeACORD125Document(
    documentInput: Buffer | string,
    inputType: 'file' | 'base64' | 'text' = 'text',
    documentType: string = 'ACORD-125'
  ): Promise<DocumentAnalysisResult> {
    await this.initialize();

    if (!this.client || this.fallbackEnabled) {
      return this.fallbackDocumentAnalysis(documentInput.toString(), documentType);
    }

    try {
      const prompt = await this.getACORD125ExtractionPrompt();
      
      // Build messages based on input type
      const messages = await this.buildVisionMessages(prompt, documentInput, inputType);
      
      const response = await this.client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
        messages,
        max_tokens: 2000,
        temperature: 0.1
        // Note: Removed response_format for Azure compatibility
      });

      const rawResponse = response.choices[0]?.message?.content;
      if (!rawResponse) {
        throw new Error('No response content from OpenAI');
      }

      // Parse JSON response with error handling
      const parsedResponse = await this.safeJsonParse(rawResponse);
      const confidence = this.calculateConfidenceScore(parsedResponse);

      return {
        extractedData: parsedResponse,
        confidence,
        documentType,
        processingMethod: 'openai',
        rawResponse: parsedResponse
      };

    } catch (error) {
      console.error('OpenAI document analysis failed:', error);
      return this.fallbackDocumentAnalysis(documentInput.toString(), documentType);
    }
  }

  /**
   * Build Vision API messages based on input type
   */
  private async buildVisionMessages(
    systemPrompt: string,
    documentInput: Buffer | string,
    inputType: 'file' | 'base64' | 'text'
  ): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    if (inputType === 'text') {
      // Text-based analysis
      messages.push({
        role: 'user',
        content: `Please analyze this ACORD 125 document content and extract the structured data:\n\n${documentInput}`
      });
    } else {
      // Vision-based analysis with images/PDFs
      let base64Data: string;
      
      if (inputType === 'file' && Buffer.isBuffer(documentInput)) {
        base64Data = documentInput.toString('base64');
      } else if (inputType === 'base64' && typeof documentInput === 'string') {
        base64Data = documentInput;
      } else {
        throw new Error('Invalid input type/data combination for Vision API');
      }

      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please analyze this ACORD 125 form document and extract the structured data as specified in the system prompt. Focus on property details, coverage amounts, and risk information.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Data}`,
              detail: 'high'
            }
          }
        ]
      });
    }

    return messages;
  }

  /**
   * Safely parse JSON response with schema validation
   */
  private async safeJsonParse(responseContent: string): Promise<any> {
    try {
      // Try to extract JSON from response if it's wrapped in text
      let jsonContent = responseContent.trim();
      
      // Look for JSON block markers
      const jsonMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/i) || 
                       jsonContent.match(/\{[\s\S]*\}/); 
      
      if (jsonMatch) {
        jsonContent = jsonMatch[1] || jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent);
      
      // Validate against expected schema
      return this.validateExtractedData(parsed);
      
    } catch (error) {
      console.warn('JSON parsing failed, attempting structured extraction:', error);
      return this.extractStructuredData(responseContent);
    }
  }

  /**
   * Validate extracted data against expected schema with proper coercion
   */
  private validateExtractedData(data: any): any {
    const PropertyDetailsSchema = z.object({
      insuredName: z.string().nullable().optional(),
      businessType: z.string().nullable().optional(),
      propertyAddress: z.string().nullable().optional(),
      buildingValue: z.coerce.number().nullable().optional(),
      contentsValue: z.coerce.number().nullable().optional(),
      businessInterruptionValue: z.coerce.number().nullable().optional()
    }).optional();

    const CoverageDetailsSchema = z.object({
      effectiveDate: z.string().nullable().optional(),
      expirationDate: z.string().nullable().optional(),
      linesOfBusiness: z.array(z.string()).nullable().optional(),
      policyLimits: z.object({
        building: z.coerce.number().nullable().optional(),
        contents: z.coerce.number().nullable().optional(),
        businessInterruption: z.coerce.number().nullable().optional()
      }).nullable().optional()
    }).optional();

    const RiskDetailsSchema = z.object({
      constructionType: z.string().nullable().optional(),
      occupancy: z.string().nullable().optional(),
      protectionClass: z.string().nullable().optional(),
      yearBuilt: z.coerce.number().nullable().optional()
    }).optional();

    const ExtractedDataSchema = z.object({
      propertyDetails: PropertyDetailsSchema,
      coverageDetails: CoverageDetailsSchema,
      riskDetails: RiskDetailsSchema,
      confidence: z.coerce.number().min(0).max(1).default(0.5)
    });

    try {
      const validated = ExtractedDataSchema.parse(data);
      // Ensure confidence is properly clamped
      if (validated.confidence < 0) validated.confidence = 0;
      if (validated.confidence > 1) validated.confidence = 1;
      return validated;
    } catch (validationError) {
      console.warn('Schema validation failed, applying fallback normalization:', validationError);
      return this.normalizeExtractedData(data);
    }
  }

  /**
   * Fallback normalization when schema validation fails
   */
  private normalizeExtractedData(data: any): any {
    const normalized: any = {
      propertyDetails: {},
      coverageDetails: {},
      riskDetails: {},
      confidence: 0.3
    };

    // Safely extract and coerce numeric values
    if (data.propertyDetails) {
      normalized.propertyDetails = {
        insuredName: data.propertyDetails.insuredName || null,
        businessType: data.propertyDetails.businessType || null,
        propertyAddress: data.propertyDetails.propertyAddress || null,
        buildingValue: this.safeParseNumber(data.propertyDetails.buildingValue),
        contentsValue: this.safeParseNumber(data.propertyDetails.contentsValue),
        businessInterruptionValue: this.safeParseNumber(data.propertyDetails.businessInterruptionValue)
      };
    }

    if (data.confidence) {
      const conf = this.safeParseNumber(data.confidence);
      normalized.confidence = conf !== null ? Math.max(0, Math.min(1, conf)) : 0.3;
    }

    return normalized;
  }

  /**
   * Safely parse numbers from strings or existing numbers
   */
  private safeParseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      // Remove currency symbols and commas
      const cleaned = value.replace(/[$,]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  /**
   * Extract structured data from unstructured response text
   */
  private extractStructuredData(responseText: string): any {
    const extracted: any = {
      propertyDetails: {},
      coverageDetails: {},
      riskDetails: {}
    };

    // Use regex patterns to extract key information
    const insuredMatch = responseText.match(/(?:insured|business)\s*(?:name)?[:\s]+([^\n]+)/i);
    if (insuredMatch) {
      extracted.propertyDetails.insuredName = insuredMatch[1].trim();
    }

    const addressMatch = responseText.match(/(?:address|location)[:\s]+([^\n]+)/i);
    if (addressMatch) {
      extracted.propertyDetails.propertyAddress = addressMatch[1].trim();
    }

    // Extract monetary values
    const valueMatches = responseText.match(/\$([\d,]+)/g);
    if (valueMatches && valueMatches.length > 0) {
      const values = valueMatches.map(v => parseInt(v.replace(/[$,]/g, '')));
      if (values[0]) extracted.propertyDetails.buildingValue = values[0];
      if (values[1]) extracted.propertyDetails.contentsValue = values[1];
    }

    extracted.confidence = 0.4; // Lower confidence for fallback extraction
    return extracted;
  }

  /**
   * Parse natural language commands for intent recognition
   * Replaces hardcoded pattern matching with intelligent understanding
   */
  async parseCommand(command: string, context: any = {}): Promise<CommandParseResult> {
    await this.initialize();

    if (!this.client || this.fallbackEnabled) {
      return this.fallbackCommandParsing(command, context);
    }

    try {
      const prompt = await this.getCommandParsingPrompt(context);
      
      const response = await this.client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: command
          }
        ],
        max_tokens: 500,
        temperature: 0.2
        // Note: Removed response_format for Azure compatibility
      });

      const rawResponse = response.choices[0]?.message?.content;
      if (!rawResponse) {
        throw new Error('No response content from OpenAI');
      }

      const parsedResponse = JSON.parse(rawResponse);
      
      return {
        intent: parsedResponse.intent || 'unknown',
        action: parsedResponse.action || 'general',
        parameters: parsedResponse.parameters || {},
        confidence: parsedResponse.confidence || 0.5
      };

    } catch (error) {
      console.error('OpenAI command parsing failed:', error);
      return this.fallbackCommandParsing(command, context);
    }
  }

  /**
   * Get ACORD 125 extraction prompt from ConfigService with Vision API support
   * Allows dynamic prompt configuration without hardcoding
   */
  private async getACORD125ExtractionPrompt(): Promise<string> {
    try {
      const promptConfig = await ConfigService.getSetting('openai.prompts.acord-125-extraction');
      if (promptConfig) {
        return promptConfig;
      }
    } catch (error) {
      console.warn('Failed to get ACORD 125 prompt from ConfigService, using default');
    }

    // Enhanced default prompt for Vision API
    return `You are an expert commercial property insurance document analyst specializing in ACORD 125 forms. Analyze the provided document (image or text) and extract key information with high accuracy.

Focus on extracting these specific data points from ACORD 125 Commercial Property Application forms:

RETURN ONLY VALID JSON in this exact format:

{
  "propertyDetails": {
    "insuredName": "Exact business name of the insured",
    "businessType": "Type of business/industry",
    "propertyAddress": "Complete property address",
    "buildingValue": 0,
    "contentsValue": 0,
    "businessInterruptionValue": 0
  },
  "coverageDetails": {
    "effectiveDate": "YYYY-MM-DD format",
    "expirationDate": "YYYY-MM-DD format",
    "linesOfBusiness": ["Commercial Property", "Business Interruption"],
    "policyLimits": {
      "building": 0,
      "contents": 0,
      "businessInterruption": 0
    }
  },
  "riskDetails": {
    "constructionType": "Construction materials/type",
    "occupancy": "Primary business use",
    "protectionClass": "Fire protection class if available",
    "yearBuilt": 0
  },
  "confidence": 0.0
}

IMPORTANT:
- Use null for missing fields, not empty strings
- Convert all monetary values to numbers (no currency symbols or commas)
- Be conservative with confidence scoring (0.0 to 1.0)
- For images: carefully read all visible text and form fields
- Focus on accuracy over completeness`;
  }

  /**
   * Get command parsing prompt from ConfigService
   */
  private async getCommandParsingPrompt(context: any): Promise<string> {
    try {
      const promptConfig = await ConfigService.getSetting('openai.prompts.command-parsing');
      if (promptConfig) {
        return promptConfig;
      }
    } catch (error) {
      console.warn('Failed to get command parsing prompt from ConfigService, using default');
    }

    // Default prompt
    const currentPersona = context.persona || 'user';
    const availableActions = context.availableActions || ['general', 'review', 'search', 'analyze'];

    return `You are a natural language command processor for an insurance underwriting system. The current user persona is "${currentPersona}".

Available actions: ${availableActions.join(', ')}

Parse the user command and return a JSON object:

{
  "intent": "The user's primary intent",
  "action": "The specific action to take from available actions",
  "parameters": {
    "key": "Extracted parameters from the command"
  },
  "confidence": "Confidence score 0-1"
}

Examples:
- "Show me the Willis submission" → {"intent": "view_submission", "action": "search", "parameters": {"submissionQuery": "Willis"}, "confidence": 0.9}
- "Check confidence levels" → {"intent": "review_confidence", "action": "analyze", "parameters": {"analysisType": "confidence"}, "confidence": 0.8}

Be precise and return valid JSON only.`;
  }

  /**
   * Calculate confidence score based on extracted data completeness
   */
  private calculateConfidenceScore(extractedData: any): number {
    let score = 0;
    let totalFields = 0;

    // Check property details
    const propertyFields = ['insuredName', 'businessType', 'propertyAddress', 'buildingValue'];
    propertyFields.forEach(field => {
      totalFields++;
      if (extractedData.propertyDetails?.[field]) score++;
    });

    // Check coverage details
    const coverageFields = ['effectiveDate', 'linesOfBusiness'];
    coverageFields.forEach(field => {
      totalFields++;
      if (extractedData.coverageDetails?.[field]) score++;
    });

    // Use OpenAI's confidence if available
    if (extractedData.confidence && typeof extractedData.confidence === 'number') {
      return Math.min(extractedData.confidence, score / totalFields);
    }

    return score / totalFields;
  }

  /**
   * Fallback document analysis using keyword-based extraction
   * Maintains existing functionality when OpenAI is unavailable
   */
  private fallbackDocumentAnalysis(documentInput: string, documentType: string): DocumentAnalysisResult {
    console.log('📋 Using fallback document analysis for:', documentType);
    
    const extractedData: any = {
      propertyDetails: {},
      coverageDetails: {},
      riskDetails: {}
    };

    // Simple keyword-based extraction (preserve existing logic)
    const content = documentInput.toLowerCase();
    
    // Extract basic information using regex patterns
    const insuredMatch = content.match(/(?:insured|business)\s*(?:name)?[:\s]+([^\n]+)/i);
    if (insuredMatch) {
      extractedData.propertyDetails.insuredName = insuredMatch[1].trim();
    }

    const addressMatch = content.match(/(?:address|location)[:\s]+([^\n]+)/i);
    if (addressMatch) {
      extractedData.propertyDetails.propertyAddress = addressMatch[1].trim();
    }

    // Basic confidence based on extracted fields
    const confidence = Object.keys(extractedData.propertyDetails).length > 0 ? 0.6 : 0.3;

    return {
      extractedData,
      confidence,
      documentType,
      processingMethod: 'keyword_fallback',
      errors: ['OpenAI unavailable, using keyword fallback']
    };
  }

  /**
   * Fallback command parsing using simple pattern matching
   */
  private fallbackCommandParsing(command: string, context: any): CommandParseResult {
    console.log('📋 Using fallback command parsing for:', command);
    
    const lowerCommand = command.toLowerCase();
    
    // Simple pattern matching (preserve existing logic)
    if (lowerCommand.includes('show') || lowerCommand.includes('view')) {
      return {
        intent: 'view',
        action: 'search',
        parameters: { query: command },
        confidence: 0.7
      };
    }
    
    if (lowerCommand.includes('confidence') || lowerCommand.includes('check')) {
      return {
        intent: 'analyze',
        action: 'analyze',
        parameters: { analysisType: 'confidence' },
        confidence: 0.7
      };
    }

    return {
      intent: 'general',
      action: 'general', 
      parameters: { command },
      confidence: 0.5
    };
  }

  /**
   * Check if OpenAI service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && !this.fallbackEnabled;
  }

  /**
   * Get service status for monitoring
   */
  getStatus(): { 
    initialized: boolean; 
    fallbackMode: boolean; 
    endpoint?: string; 
    deployment?: string;
  } {
    return {
      initialized: this.isInitialized,
      fallbackMode: this.fallbackEnabled,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME
    };
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();