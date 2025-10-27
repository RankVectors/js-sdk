/**
 * RankVectors TypeScript/JavaScript SDK
 * 
 * Official SDK for the RankVectors Link Implementation API
 */

export interface RankVectorsConfig {
  apiKey: string
  baseUrl?: string
}

export interface Suggestion {
  id: string
  sourcePageId: string
  targetPageId: string
  anchorText: string
  context: string
  relevanceScore: number
  status: string
  reason?: string
  createdAt: string
}

export interface Implementation {
  id: string
  status: string
  platform: string
  creditsUsed: number
  createdAt: string
  completedAt?: string
  error?: string
  suggestion: {
    anchorText: string
    sourcePage: {
      url: string
      title: string
    }
    targetPage: {
      url: string
      title: string
    }
  }
}

export interface CreditBalance {
  projectId: string
  creditsTotal: number
  creditsUsed: number
  creditsRemaining: number
  lastResetAt: string
}

export interface CreditUsage {
  id: string
  action: string
  creditsUsed: number
  metadata?: any
  createdAt: string
}

export interface ChangeStatus {
  pageUrl: string
  changeStatus: 'new' | 'same' | 'changed' | 'removed'
  visibility: 'visible' | 'hidden'
  previousScrapeAt: string | null
  diff?: {
    text: string
    json: any
  }
}

export interface ImplementOptions {
  platform: 'wordpress' | 'shopify' | 'custom'
  credentials: WordPressCredentials | ShopifyCredentials | CustomCredentials
  skipContentVerification?: boolean
  implementationMethod?: 'api' | 'manual'
}

export interface WordPressCredentials {
  siteUrl: string
  username?: string
  applicationPassword?: string
  jwtToken?: string
}

export interface ShopifyCredentials {
  shopDomain: string
  accessToken: string
  apiVersion?: string
}

export interface CustomCredentials {
  webhookUrl?: string
  apiKey?: string
  customHeaders?: Record<string, string>
}

export interface DateRange {
  startDate?: Date
  endDate?: Date
}

export class RankVectorsSDK {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string = 'https://rankvectors.com') {
    if (!apiKey) {
      throw new Error('API key is required')
    }
    this.apiKey = apiKey
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
  }

  /**
   * Make an HTTP request to the API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || `API request failed: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  }

  // ============================================================
  // Suggestions
  // ============================================================

  /**
   * Get link suggestions for a project
   */
  async getSuggestions(
    projectId: string,
    filters?: { status?: string; limit?: number; offset?: number }
  ): Promise<Suggestion[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const query = params.toString()
    const endpoint = `/api/projects/${projectId}/suggestions${query ? '?' + query : ''}`

    const response = await this.request<{ suggestions: Suggestion[] }>(endpoint)
    return response.suggestions
  }

  /**
   * Approve a suggestion
   */
  async approveSuggestion(suggestionId: string): Promise<void> {
    await this.request(`/api/projects/suggestions/${suggestionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
    })
  }

  /**
   * Reject a suggestion
   */
  async rejectSuggestion(suggestionId: string): Promise<void> {
    await this.request(`/api/projects/suggestions/${suggestionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected' }),
    })
  }

  // ============================================================
  // Implementations
  // ============================================================

  /**
   * Implement one or more links
   */
  async implementLinks(
    projectId: string,
    suggestionIds: string[],
    options: ImplementOptions
  ): Promise<{
    success: boolean
    results: Array<{
      success: boolean
      implementationId?: string
      error?: string
      creditsUsed?: number
    }>
    summary: {
      total: number
      succeeded: number
      failed: number
      creditsUsed: number
    }
  }> {
    return this.request(`/api/projects/${projectId}/implementations`, {
      method: 'POST',
      body: JSON.stringify({
        suggestionIds,
        ...options,
      }),
    })
  }

  /**
   * Get implementation details
   */
  async getImplementation(
    projectId: string,
    implementationId: string
  ): Promise<Implementation> {
    const response = await this.request<{ implementation: Implementation }>(
      `/api/projects/${projectId}/implementations/${implementationId}`
    )
    return response.implementation
  }

  /**
   * Get implementation history for a project
   */
  async getImplementations(
    projectId: string,
    filters?: {
      status?: string
      platform?: string
      limit?: number
      offset?: number
    }
  ): Promise<Implementation[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.platform) params.append('platform', filters.platform)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const query = params.toString()
    const endpoint = `/api/projects/${projectId}/implementations${query ? '?' + query : ''}`

    const response = await this.request<{ implementations: Implementation[] }>(endpoint)
    return response.implementations
  }

  /**
   * Rollback an implementation
   */
  async rollbackImplementation(
    projectId: string,
    implementationId: string,
    reason?: string,
    credentials?: any
  ): Promise<{
    success: boolean
    creditsRefunded: number
    message: string
  }> {
    return this.request(
      `/api/projects/${projectId}/implementations/${implementationId}/rollback`,
      {
        method: 'POST',
        body: JSON.stringify({ reason, credentials }),
      }
    )
  }

  // ============================================================
  // Credits
  // ============================================================

  /**
   * Get credit balance for a project
   */
  async getCredits(
    projectId: string,
    includeHistory: boolean = false,
    dateRange?: DateRange
  ): Promise<{
    balance: CreditBalance
    usageHistory?: CreditUsage[]
  }> {
    const params = new URLSearchParams()
    if (includeHistory) params.append('includeHistory', 'true')
    if (dateRange?.startDate) {
      params.append('startDate', dateRange.startDate.toISOString())
    }
    if (dateRange?.endDate) {
      params.append('endDate', dateRange.endDate.toISOString())
    }

    const query = params.toString()
    const endpoint = `/api/projects/${projectId}/credits${query ? '?' + query : ''}`

    return this.request(endpoint)
  }

  /**
   * Get credit usage history
   */
  async getCreditUsage(
    projectId: string,
    dateRange?: DateRange
  ): Promise<CreditUsage[]> {
    const result = await this.getCredits(projectId, true, dateRange)
    return result.usageHistory || []
  }

  /**
   * Add credits to a project (admin use)
   */
  async addCredits(
    projectId: string,
    amount: number,
    source?: string
  ): Promise<CreditBalance> {
    const response = await this.request<{ balance: CreditBalance }>(
      `/api/projects/${projectId}/credits`,
      {
        method: 'POST',
        body: JSON.stringify({ amount, source }),
      }
    )
    return response.balance
  }

  // ============================================================
  // Change Detection
  // ============================================================

  /**
   * Verify if page content has changed
   */
  async verifyContent(
    projectId: string,
    pageUrl: string,
    suggestionId?: string
  ): Promise<{
    safe: boolean
    reason: string
    changeResult?: ChangeStatus
  }> {
    const response = await this.request<{
      verification: {
        safe: boolean
        reason: string
        changeResult?: ChangeStatus
      }
    }>(`/api/projects/${projectId}/verify-content`, {
      method: 'POST',
      body: JSON.stringify({ pageUrl, suggestionId }),
    })
    return response.verification
  }
}

// Export types
export default RankVectorsSDK

