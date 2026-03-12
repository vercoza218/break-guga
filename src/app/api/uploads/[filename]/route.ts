import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const uploadsDir = path.join(process.env.DATA_DIR || process.cwd(), 'uploads');
  const filepath = path.join(uploadsDir, params.filename);

  // Prevent directory traversal
  if (!filepath.startsWith(uploadsDir)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const file = await readFile(filepath);
    const ext = path.extname(params.filename).toLowerCase();
    const contentType =
      ext === '.png' ? 'image/png' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      ext === '.gif' ? 'image/gif' :
      ext === '.webp' ? 'image/webp' :
      'application/octet-stream';

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
