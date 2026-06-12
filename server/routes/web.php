<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'name' => 'SmartShift API',
    'status' => 'running',
    'api' => '/api/v1',
]));
