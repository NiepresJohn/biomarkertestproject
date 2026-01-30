import { NextResponse } from 'next/server';
import { updateBiomarkerValue, deleteBiomarker } from '@/src/lib/biomarkerOperations';

// Update biomarker value
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { value } = await request.json();

    if (typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Value must be a number' },
        { status: 400 }
      );
    }

    const result = await updateBiomarkerValue(id, value);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Biomarker updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Delete biomarker
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteBiomarker(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Biomarker deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
