# Sokudo CLI

Terminal-based typing trainer for developers. Practice git commands, terminal workflows, React patterns, and more directly from your terminal.

## Installation

```bash
# From the project root
pnpm install

# Make the CLI available globally (optional)
npm link
```

## Authentication

Before using the CLI, you need to authenticate with your Sokudo account:

### Using API Key

1. Generate an API key from your Sokudo dashboard at `http://localhost:3000/dashboard/api-keys`
2. Login with the key:

```bash
sokudo login --api-key YOUR_API_KEY
```

Or run `sokudo login` and enter the key when prompted.

## Commands

### `sokudo practice`

Start a typing practice session.

**Options:**
- `-c, --category <slug>` - Practice a specific category (e.g., git-basics, docker)
- `-d, --difficulty <level>` - Filter by difficulty (beginner, intermediate, advanced)
- `-r, --random` - Practice a random challenge
- `--offline` - Practice in offline mode (sessions sync later)

**Examples:**

```bash
# Practice any challenge
sokudo practice

# Practice git commands
sokudo practice --category git-basics

# Practice advanced Docker commands
sokudo practice --category docker --difficulty advanced

# Random challenge
sokudo practice --random
```

### `sokudo categories`

List all available practice categories.

**Options:**
- `-f, --free` - Show only free categories

**Example:**

```bash
sokudo categories
```

### `sokudo stats`

View your typing statistics.

**Options:**
- `-d, --days <number>` - Show stats for the last N days (default: 7)
- `--detailed` - Show detailed keystroke analysis

**Examples:**

```bash
# Last 7 days
sokudo stats

# Last 30 days
sokudo stats --days 30

# Detailed key accuracy analysis
sokudo stats --detailed
```

### `sokudo sync`

Sync offline practice sessions to the server.

**Example:**

```bash
sokudo sync
```

### `sokudo logout`

Remove stored authentication credentials.

**Example:**

```bash
sokudo logout
```

## Practice Interface

When you start a practice session, you'll see:

1. **Challenge header** - Challenge ID, difficulty, and type
2. **Typing area** - The text to type with:
   - **Green** text for correct characters
   - **Red background** for errors
   - **Underlined** character shows cursor position
   - **Dimmed** text for upcoming characters
3. **Live stats** - WPM, accuracy, and error count update in real-time
4. **Keyboard shortcuts**:
   - Type normally to practice
   - **Backspace** to correct errors
   - **Ctrl+C** to exit

## Configuration

Configuration is stored in `~/.sokudo/config.json`:

```json
{
  "apiKey": "your-api-key",
  "baseUrl": "http://localhost:3000",
  "userId": 1,
  "email": "user@example.com"
}
```

Offline sessions are stored in `~/.sokudo/offline-sessions.json` and automatically synced when you run `sokudo sync`.

## Environment Variables

- `SOKUDO_BASE_URL` - Override the base URL (default: http://localhost:3000)

**Example:**

```bash
export SOKUDO_BASE_URL=https://sokudo.example.com
sokudo login
```

## Development

```bash
# Run CLI locally with tsx
npx tsx cli/index.ts practice

# Run tests
pnpm test cli

# Build
pnpm cli:build
```

## Features

- ✅ Terminal-based typing practice
- ✅ Real-time WPM and accuracy tracking
- ✅ Keystroke latency analysis
- ✅ Category and difficulty filtering
- ✅ Session history and statistics
- ✅ Offline mode with auto-sync
- ✅ Achievement tracking
- ✅ Key accuracy analysis

## Troubleshooting

### "Please login first" error

Make sure you've authenticated with `sokudo login` before practicing.

### Terminal rendering issues

The CLI uses ANSI escape codes for colors and formatting. Ensure your terminal supports:
- ANSI colors
- Raw mode input (for keystroke capture)

Tested on: macOS Terminal, iTerm2, Linux terminals, Windows Terminal

### API connection errors

- Verify the Sokudo server is running at `http://localhost:3000`
- Check your API key is valid
- Use `SOKUDO_BASE_URL` environment variable if running on a different host

## License

Same as Sokudo project.
