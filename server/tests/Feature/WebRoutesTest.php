<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_spa_routes_return_the_app_shell(): void
    {
        foreach ([
            '/',
            '/login',
            '/register',
            '/dashboard',
            '/shifts',
            '/tasks',
            '/my-schedule',
            '/swap-requests',
            '/planner',
            '/users',
        ] as $uri) {
            $this->get($uri)
                ->assertOk()
                ->assertSee('id="app"', false);
        }
    }
}
