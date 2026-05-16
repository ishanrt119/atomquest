import { NextResponse } from "next/server";

export function successResponse(data: any, message: string = "Success", status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function errorResponse(message: string, status: number = 400, errors: any = null) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status }
  );
}
