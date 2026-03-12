import { getVersion } from '@/lib/version';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  let lastVersion = -1;
  let intervalId: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      const sendData = () => {
        try {
          const db = getDb();
          const queue = db.prepare(`
            SELECT q.*, p.name as product_name, p.image as product_image
            FROM queue q
            JOIN products p ON q.product_id = p.id
            ORDER BY q.position ASC
          `).all();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(queue)}\n\n`));
        } catch {
          // ignore errors during send
        }
      };

      // Send initial data
      sendData();
      lastVersion = getVersion();

      // Check for changes every 1 second
      intervalId = setInterval(() => {
        const currentVersion = getVersion();
        if (currentVersion !== lastVersion) {
          lastVersion = currentVersion;
          sendData();
        }
      }, 1000);
    },
    cancel() {
      clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
