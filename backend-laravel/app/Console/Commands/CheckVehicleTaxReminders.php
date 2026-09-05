<?php

namespace App\Console\Commands;

use App\Support\VehicleTaxReminder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckVehicleTaxReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vehicle:tax-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check vehicle tax due dates and log vehicles needing attention.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $result = VehicleTaxReminder::summarize();
        $summary = $result['summary'];

        $this->info('Vehicle tax reminder check completed.');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total vehicles', $summary['total_vehicles']],
                ['Overdue', $summary['overdue']],
                ['Due today', $summary['due_today']],
                ['Due within 7 days', $summary['due_soon_7']],
                ['Due within 14 days', $summary['due_soon_14']],
                ['Due within 30 days', $summary['due_soon_30']],
                ['Needs attention', $summary['needs_attention']],
            ],
        );

        if ($summary['needs_attention'] > 0) {
            $attention = $result['vehicles'];
            $this->newLine();
            $this->info('Vehicles needing attention:');
            foreach ($attention as $vehicle) {
                $due = $vehicle->tax_due_date ? \Carbon\Carbon::parse($vehicle->tax_due_date) : null;
                $label = 'no tax date';
                if ($due) {
                    $label = $due->lt(now()->startOfDay())
                        ? 'overdue'
                        : 'due in '.abs($due->startOfDay()->diffInDays(now()->startOfDay())).' day(s)';
                }
                $this->line("  - {$vehicle->asset_code} {$vehicle->brand} {$vehicle->model} ({$vehicle->plate_number}) tax_due={$vehicle->tax_due_date?->format('Y-m-d')} [{$label}]");
            }

            Log::channel('daily')->notice('Vehicle tax reminders: '.$summary['needs_attention'].' vehicle(s) need attention.', $summary);
        } else {
            $this->info('No vehicles need tax attention.');
        }

        return self::SUCCESS;
    }
}
