import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

// Fixed import for GNOME Shell 45+
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Utils from './utils.js';

const CPUGraphIndicator = GObject.registerClass(
class CPUGraphIndicator extends PanelMenu.Button {
    _init(settings) {
        super._init(0.0, 'CPU Graph', false);
        
        this._settings = settings;
        this._cpuHistory = [];
        this._updateTimeoutId = null;
        this._tooltip = null;
        this._destroyed = false;
        
        this._connectSettings();
        this._createUI();
        this._startUpdating();
    }
    
    _connectSettings() {
        this._settingsConnections = [];
        
        // Connect to settings changes
        const settingsKeys = [
            'update-interval',
            'graph-width', 
            'graph-height',
            'show-tooltip',
            'smooth-animation',
            'color-scheme',
            'background-style',
            'per-core-mode',
            'click-action',
            'bar-width'
        ];
        
        settingsKeys.forEach(key => {
            const id = this._settings.connect(`changed::${key}`, () => {
                if (!this._destroyed) {
                    this._onSettingsChanged();
                }
            });
            this._settingsConnections.push(id);
        });
    }
    
    _onSettingsChanged() {
        // Restart with new settings
        this._stopUpdating();
        this._recreateUI();
        this._startUpdating();
    }
    
    _recreateUI() {
        // Remove old UI
        this.remove_all_children();
        
        // Reset history
        this._cpuHistory = [];
        
        // Create new UI
        this._createUI();
    }
    
    _createUI() {
        const graphWidth = this._settings.get_int('graph-width');
        const graphHeight = this._settings.get_int('graph-height');
        const barWidth = this._settings.get_int('bar-width');
        const backgroundStyle = this._settings.get_string('background-style');
        
        // Create the main container
        this._graphContainer = new St.Widget({
            style_class: this._getContainerStyleClass(backgroundStyle),
            width: graphWidth,
            height: graphHeight,
            reactive: true,
            can_focus: true,
            track_hover: true
        });
        
        // Create drawing area
        this._drawingArea = new St.DrawingArea({
            width: graphWidth,
            height: graphHeight,
            style_class: 'cpu-graph-area'
        });
        
        this._drawingArea.connect('repaint', this._onRepaint.bind(this));
        this._graphContainer.add_child(this._drawingArea);
        
        // Add tooltip if enabled
        if (this._settings.get_boolean('show-tooltip')) {
            this._graphContainer.connect('notify::hover', this._onHover.bind(this));
        }
        
        // Add click handler
        this._graphContainer.connect('button-press-event', this._onButtonPress.bind(this));
        
        this.add_child(this._graphContainer);
        
        // Initialize history
        const historySize = Math.floor(graphWidth / barWidth);
        this._cpuHistory = new Array(historySize).fill(0);
    }
    
    _getContainerStyleClass(backgroundStyle) {
        switch (backgroundStyle) {
            case 'transparent':
                return 'cpu-graph-container-transparent';
            case 'dark':
                return 'cpu-graph-container-dark';
            case 'light':
                return 'cpu-graph-container-light';
            case 'glass':
                return 'cpu-graph-container-glass';
            case 'default':
            default:
                return 'cpu-graph-container';
        }
    }
    
    _onButtonPress(actor, event) {
        if (event.get_button() === 1) { // Left click
            const clickAction = this._settings.get_string('click-action');
            
            switch (clickAction) {
                case 'system-monitor':
                    this._openSystemMonitor();
                    break;
                case 'task-manager':
                    this._openTaskManager();
                    break;
                case 'detailed-popup':
                    this._showDetailedPopup();
                    break;
                case 'none':
                default:
                    break;
            }
        }
        return Clutter.EVENT_PROPAGATE;
    }
    
    _openSystemMonitor() {
        try {
            GLib.spawn_command_line_async('gnome-system-monitor');
        } catch (e) {
            console.error('Failed to open system monitor:', e.message);
        }
    }
    
    _openTaskManager() {
        // Try various task managers
        const taskManagers = ['gnome-system-monitor', 'htop', 'top'];
        for (const tm of taskManagers) {
            try {
                if (GLib.find_program_in_path(tm)) {
                    if (tm === 'gnome-system-monitor') {
                        GLib.spawn_command_line_async(tm);
                    } else {
                        GLib.spawn_command_line_async(`gnome-terminal -- ${tm}`);
                    }
                    break;
                }
            } catch (e) {
                console.warn(`Failed to launch ${tm}:`, e.message);
            }
        }
    }
    
    _showDetailedPopup() {
        // Implementation for detailed popup would go here
        console.log('Detailed popup not yet implemented');
    }
    
    _onHover() {
        if (!this._settings.get_boolean('show-tooltip')) {
            return;
        }
        
        if (this._graphContainer.hover) {
            const currentUsage = this._cpuHistory[this._cpuHistory.length - 1] || 0;
            this._showTooltip(`CPU: ${Math.round(currentUsage)}%`);
        } else {
            this._hideTooltip();
        }
    }
    
    _showTooltip(text) {
        if (!this._tooltip) {
            this._tooltip = new St.Label({
                style_class: 'cpu-graph-tooltip',
                text: text
            });
            Main.uiGroup.add_child(this._tooltip);
        } else {
            this._tooltip.text = text;
        }
        
        try {
            const [stageX, stageY] = this._graphContainer.get_transformed_position();
            this._tooltip.set_position(
                stageX + this._graphContainer.width / 2 - this._tooltip.width / 2,
                stageY - this._tooltip.height - 5
            );
            this._tooltip.show();
        } catch (e) {
            console.warn('Failed to position tooltip:', e.message);
        }
    }
    
    _hideTooltip() {
        if (this._tooltip) {
            this._tooltip.hide();
        }
    }
    
    _onRepaint(area) {
        try {
            const cr = area.get_context();
            const [width, height] = area.get_surface_size();
            const barWidth = this._settings.get_int('bar-width');
            
            // Clear background
            cr.setOperator(1); // CAIRO_OPERATOR_CLEAR
            cr.paint();
            cr.setOperator(0); // CAIRO_OPERATOR_OVER
            
            // Draw bars
            const barCount = Math.min(this._cpuHistory.length, Math.floor(width / barWidth));
            
            for (let i = 0; i < barCount; i++) {
                const usage = this._cpuHistory[this._cpuHistory.length - barCount + i];
                const barHeight = Math.max(1, (usage / 100) * height);
                const x = i * barWidth;
                const y = height - barHeight;
                
                // Set color based on usage and color scheme
                this._setColorForUsage(cr, usage);
                
                cr.rectangle(x, y, barWidth - 1, barHeight);
                cr.fill();
            }
        } catch (e) {
            console.error('Error in _onRepaint:', e.message);
        }
    }
    
    _setColorForUsage(cr, usage) {
        const colorScheme = this._settings.get_string('color-scheme');
        
        switch (colorScheme) {
            case 'monochrome':
                cr.setSourceRGBA(0.8, 0.8, 0.8, 0.9);
                break;
            case 'plasma':
                if (usage < 30) {
                    cr.setSourceRGBA(0.3, 0.7, 1.0, 0.9);
                } else if (usage < 70) {
                    cr.setSourceRGBA(0.7, 0.3, 1.0, 0.9);
                } else {
                    cr.setSourceRGBA(1.0, 0.2, 0.8, 0.9);
                }
                break;
            case 'ocean':
                if (usage < 30) {
                    cr.setSourceRGBA(0.0, 0.6, 0.8, 0.9);
                } else if (usage < 70) {
                    cr.setSourceRGBA(0.0, 0.4, 0.9, 0.9);
                } else {
                    cr.setSourceRGBA(0.2, 0.2, 1.0, 0.9);
                }
                break;
            case 'sunset':
                if (usage < 30) {
                    cr.setSourceRGBA(1.0, 0.8, 0.2, 0.9);
                } else if (usage < 70) {
                    cr.setSourceRGBA(1.0, 0.5, 0.2, 0.9);
                } else {
                    cr.setSourceRGBA(1.0, 0.2, 0.2, 0.9);
                }
                break;
            case 'default':
            default:
                if (usage < 30) {
                    cr.setSourceRGBA(0.2, 0.8, 0.6, 0.9);
                } else if (usage < 70) {
                    cr.setSourceRGBA(0.4, 0.6, 1.0, 0.9);
                } else {
                    cr.setSourceRGBA(1.0, 0.3, 0.3, 0.9);
                }
                break;
        }
    }
    
    _startUpdating() {
        this._updateCPUUsage();
        const updateInterval = this._settings.get_double('update-interval');
        
        this._updateTimeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            updateInterval,
            () => {
                if (!this._destroyed) {
                    this._updateCPUUsage();
                    return GLib.SOURCE_CONTINUE;
                }
                return GLib.SOURCE_REMOVE;
            }
        );
    }
    
    _stopUpdating() {
        if (this._updateTimeoutId) {
            GLib.source_remove(this._updateTimeoutId);
            this._updateTimeoutId = null;
        }
    }
    
    _updateCPUUsage() {
        try {
            const perCoreMode = this._settings.get_boolean('per-core-mode');
            const usage = perCoreMode ? Utils.getAverageCPUUsage() : Utils.getCPUUsage();
            
            // Add new value and remove old ones
            this._cpuHistory.push(usage);
            const historySize = Math.floor(this._settings.get_int('graph-width') / this._settings.get_int('bar-width'));
            
            if (this._cpuHistory.length > historySize) {
                this._cpuHistory.shift();
            }
            
            // Trigger repaint
            if (this._drawingArea && !this._destroyed) {
                this._drawingArea.queue_repaint();
            }
        } catch (e) {
            console.error('Error updating CPU usage:', e.message);
        }
    }
    
    destroy() {
        this._destroyed = true;
        this._stopUpdating();
        
        // Disconnect settings
        if (this._settingsConnections) {
            this._settingsConnections.forEach(id => {
                this._settings.disconnect(id);
            });
            this._settingsConnections = null;
        }
        
        if (this._tooltip) {
            this._tooltip.destroy();
            this._tooltip = null;
        }
        
        super.destroy();
    }
});

export default class TopCPUGraphExtension extends Extension {
    enable() {
        console.log('Enabling CPU Graph extension');
        
        try {
            this._settings = this.getSettings();
            this._indicator = new CPUGraphIndicator(this._settings);
            
            const panelPosition = this._settings.get_string('panel-position');
            Main.panel.addToStatusArea('cpu-graph', this._indicator, 1, panelPosition);
        } catch (e) {
            console.error('Error enabling CPU Graph extension:', e.message);
        }
    }
    
    disable() {
        console.log('Disabling CPU Graph extension');
        
        try {
            if (this._indicator) {
                this._indicator.destroy();
                this._indicator = null;
            }
            
            this._settings = null;
        } catch (e) {
            console.error('Error disabling CPU Graph extension:', e.message);
        }
    }
}