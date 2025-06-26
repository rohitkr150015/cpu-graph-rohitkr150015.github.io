import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

let _lastCpuStats = null;
let _lastPerCoreStats = null;
let _systemInfo = null;

/**
 * Parse /proc/stat to get CPU statistics
 */
function _parseCpuStats() {
    try {
        const file = Gio.File.new_for_path('/proc/stat');
        const [success, contents] = file.load_contents(null);
        
        if (!success) {
            console.error('Failed to read /proc/stat');
            return null;
        }
        
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(contents);
        const lines = text.split('\n');
        
        // Parse aggregate CPU stats (first line)
        const cpuLine = lines[0];
        if (!cpuLine.startsWith('cpu ')) {
            console.error('Invalid /proc/stat format');
            return null;
        }
        
        const values = cpuLine.split(/\s+/).slice(1).map(x => parseInt(x) || 0);
        
        if (values.length < 4) {
            console.error('Insufficient CPU stat values');
            return null;
        }
        
        const stats = {
            user: values[0] || 0,
            nice: values[1] || 0,
            system: values[2] || 0,
            idle: values[3] || 0,
            iowait: values[4] || 0,
            irq: values[5] || 0,
            softirq: values[6] || 0,
            steal: values[7] || 0,
            guest: values[8] || 0,
            guest_nice: values[9] || 0
        };
        
        // Parse per-core stats
        const coreStats = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('cpu') && /^cpu\d+/.test(line)) {
                const coreValues = line.split(/\s+/).slice(1).map(x => parseInt(x) || 0);
                if (coreValues.length >= 4) {
                    coreStats.push({
                        user: coreValues[0] || 0,
                        nice: coreValues[1] || 0,
                        system: coreValues[2] || 0,
                        idle: coreValues[3] || 0,
                        iowait: coreValues[4] || 0,
                        irq: coreValues[5] || 0,
                        softirq: coreValues[6] || 0,
                        steal: coreValues[7] || 0,
                        guest: coreValues[8] || 0,
                        guest_nice: coreValues[9] || 0
                    });
                }
            } else if (!line.startsWith('cpu')) {
                // Stop when we hit non-CPU lines
                break;
            }
        }
        
        return { aggregate: stats, cores: coreStats };
    } catch (e) {
        console.error(`Error reading CPU stats: ${e.message}`);
        return null;
    }
}

/**
 * Calculate CPU usage percentage from two stat snapshots
 */
function _calculateCpuUsage(prev, curr) {
    if (!prev || !curr) {
        return 0;
    }
    
    try {
        // Calculate total time for both snapshots
        const prevTotal = prev.user + prev.nice + prev.system + prev.idle + 
                         prev.iowait + prev.irq + prev.softirq + prev.steal +
                         prev.guest + prev.guest_nice;
        const currTotal = curr.user + curr.nice + curr.system + curr.idle + 
                         curr.iowait + curr.irq + curr.softirq + curr.steal +
                         curr.guest + curr.guest_nice;
        
        // Calculate idle time for both snapshots
        const prevIdle = prev.idle + prev.iowait;
        const currIdle = curr.idle + curr.iowait;
        
        // Calculate differences
        const totalDiff = currTotal - prevTotal;
        const idleDiff = currIdle - prevIdle;
        
        // Avoid division by zero
        if (totalDiff === 0) {
            return 0;
        }
        
        // Calculate usage percentage
        const usage = ((totalDiff - idleDiff) / totalDiff) * 100;
        
        // Ensure result is within valid bounds
        return Math.max(0, Math.min(100, usage));
    } catch (e) {
        console.error(`Error calculating CPU usage: ${e.message}`);
        return 0;
    }
}

/**
 * Get current aggregate CPU usage percentage
 */
export function getCPUUsage() {
    const currentStats = _parseCpuStats();
    
    if (!currentStats) {
        return 0;
    }
    
    let usage = 0;
    
    if (_lastCpuStats) {
        usage = _calculateCpuUsage(_lastCpuStats.aggregate, currentStats.aggregate);
    }
    
    _lastCpuStats = currentStats;
    return Math.round(usage * 10) / 10; // Round to 1 decimal place
}

/**
 * Get average CPU usage across all cores
 */
export function getAverageCPUUsage() {
    const currentStats = _parseCpuStats();
    
    if (!currentStats || !currentStats.cores.length) {
        return getCPUUsage(); // Fallback to aggregate
    }
    
    let totalUsage = 0;
    let validCores = 0;
    
    if (_lastPerCoreStats && _lastPerCoreStats.cores.length === currentStats.cores.length) {
        for (let i = 0; i < currentStats.cores.length; i++) {
            const usage = _calculateCpuUsage(_lastPerCoreStats.cores[i], currentStats.cores[i]);
            if (!isNaN(usage) && usage >= 0) {
                totalUsage += usage;
                validCores++;
            }
        }
    }
    
    _lastPerCoreStats = currentStats;
    
    const averageUsage = validCores > 0 ? totalUsage / validCores : 0;
    return Math.round(averageUsage * 10) / 10; // Round to 1 decimal place
}

/**
 * Get per-core CPU usage
 */
export function getPerCoreCPUUsage() {
    const currentStats = _parseCpuStats();
    
    if (!currentStats || !currentStats.cores.length) {
        return [getCPUUsage()]; // Return single value in array as fallback
    }
    
    const coreUsages = [];
    
    if (_lastPerCoreStats && _lastPerCoreStats.cores.length === currentStats.cores.length) {
        for (let i = 0; i < currentStats.cores.length; i++) {
            const usage = _calculateCpuUsage(_lastPerCoreStats.cores[i], currentStats.cores[i]);
            coreUsages.push(isNaN(usage) ? 0 : Math.round(usage * 10) / 10);
        }
    } else {
        // First run, return zeros
        coreUsages.push(...new Array(currentStats.cores.length).fill(0));
    }
    
    _lastPerCoreStats = currentStats;
    return coreUsages;
}

/**
 * Get CPU core count
 */
export function getCPUCoreCount() {
    if (!_systemInfo) {
        _initSystemInfo();
    }
    return _systemInfo.cpuCount;
}

/**
 * Reset CPU stats (useful when changing modes)
 */
export function resetCPUStats() {
    _lastCpuStats = null;
    _lastPerCoreStats = null;
}

/**
 * Initialize system information
 */
function _initSystemInfo() {
    try {
        // Get CPU count from GLib
        const cpuCount = GLib.get_num_processors();
        
        // Try to get more detailed CPU info
        let cpuModel = 'Unknown CPU';
        let cpuFrequency = 'Unknown';
        
        try {
            const file = Gio.File.new_for_path('/proc/cpuinfo');
            const [success, contents] = file.load_contents(null);
            if (success) {
                const decoder = new TextDecoder('utf-8');
                const text = decoder.decode(contents);
                
                // Extract CPU model name
                const modelMatch = text.match(/model name\s*:\s*(.+)/);
                if (modelMatch) {
                    cpuModel = modelMatch[1].trim();
                }
                
                // Extract CPU frequency
                const freqMatch = text.match(/cpu MHz\s*:\s*([0-9.]+)/);
                if (freqMatch) {
                    const mhz = parseFloat(freqMatch[1]);
                    if (mhz >= 1000) {
                        cpuFrequency = `${(mhz / 1000).toFixed(2)} GHz`;
                    } else {
                        cpuFrequency = `${mhz.toFixed(0)} MHz`;
                    }
                }
            }
        } catch (e) {
            console.warn(`Could not read detailed CPU info: ${e.message}`);
        }
        
        _systemInfo = {
            cpuCount,
            cpuModel,
            cpuFrequency
        };
    } catch (e) {
        console.error(`Error getting system info: ${e.message}`);
        _systemInfo = {
            cpuCount: 1,
            cpuModel: 'Unknown CPU',
            cpuFrequency: 'Unknown'
        };
    }
}

/**
 * Get system information
 */
export function getSystemInfo() {
    if (!_systemInfo) {
        _initSystemInfo();
    }
    return { ..._systemInfo };
}

/**
 * Check if CPU monitoring is available
 */
export function isCPUMonitoringAvailable() {
    try {
        const file = Gio.File.new_for_path('/proc/stat');
        return file.query_exists(null);
    } catch (e) {
        return false;
    }
}

/**
 * Get formatted CPU usage string
 */
export function getFormattedCPUUsage(perCore = false) {
    if (perCore) {
        const coreUsages = getPerCoreCPUUsage();
        return coreUsages.map((usage, index) => 
            `Core ${index}: ${usage.toFixed(1)}%`
        ).join('\n');
    } else {
        const usage = getCPUUsage();
        return `CPU: ${usage.toFixed(1)}%`;
    }
}

/**
 * Validate CPU usage value
 */
export function isValidUsage(usage) {
    return typeof usage === 'number' && 
           !isNaN(usage) && 
           isFinite(usage) && 
           usage >= 0 && 
           usage <= 100;
}

// Initialize system info on import
_initSystemInfo();
