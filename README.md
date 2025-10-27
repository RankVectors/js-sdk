# RankVectors TypeScript/JavaScript SDK

Official SDK for the RankVectors Link Implementation API.

## Installation

```bash
npm install @rankvectors/sdk
```

## Usage

```typescript
import { RankVectorsSDK } from '@rankvectors/sdk'

const client = new RankVectorsSDK('your-api-key')

// Implement links
const result = await client.implementLinks('project-id', ['suggestion-id-1'], {
  platform: 'wordpress',
  credentials: {
    siteUrl: 'https://yoursite.com',
    username: 'admin',
    applicationPassword: 'xxxx xxxx xxxx xxxx',
  },
})

console.log(`Implemented ${result.summary.succeeded} links`)

// Check credits
const { balance } = await client.getCredits('project-id')
console.log(`Remaining credits: ${balance.creditsRemaining}`)

// Verify content
const verification = await client.verifyContent(
  'project-id',
  'https://example.com/page',
  'suggestion-id'
)

if (!verification.safe) {
  console.log(`Warning: ${verification.reason}`)
}

// Rollback implementation
await client.rollbackImplementation('project-id', 'implementation-id', 'Incorrect placement')
```

## API Reference

See [API Documentation](https://rankvectors.com/docs) for complete reference.

## License

MIT

