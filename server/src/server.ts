import { app } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import http from 'http';
import { setupSocketIO } from './socket';
import { seedDefaultAdmin } from './seeders/adminSeeder';

const startServer = async () => {
  await connectDB();

  // Seed default admin account if none exists
  await seedDefaultAdmin();

  // Validate OpenAI API key format on startup
  const openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey || openAIKey === 'dummy_key') {
    console.warn('\\n⚠️  [OpenAI] OPENAI_API_KEY is missing. AI features will use mock/fallback responses.\\n');
  } else if (!openAIKey.startsWith('sk-')) {
    console.warn('\\n⚠️  [OpenAI] OPENAI_API_KEY does not look like a valid OpenAI key (should start with "sk-").');
    console.warn('    Current key prefix:', openAIKey.substring(0, 8) + '...');
    console.warn('    AI features will use mock/fallback responses until a valid key is set.\\n');
  } else {
    console.log('✅ [OpenAI] API key detected. Live AI features enabled.');
  }

  const server = http.createServer(app);
  setupSocketIO(server);

  server.listen(env.PORT, () => {
    console.log(`[MockMate AI Server] is running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`);
  });
};

startServer();
