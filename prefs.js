import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

// Fixed import for GNOME Shell 45+
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class CPUGraphPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        try {
            const settings = this.getSettings();
            
            // Create preferences page
            const page = new Adw.PreferencesPage({
                title: 'CPU Graph Preferences',
                icon_name: 'applications-system-symbolic',
            });
            
            window.add(page);
            
            // General group
            const generalGroup = new Adw.PreferencesGroup({
                title: 'General Settings',
                description: 'Configure CPU graph display options',
            });
            
            page.add(generalGroup);
            
            // Update interval setting
            const updateIntervalRow = new Adw.SpinRow({
                title: 'Update Interval',
                subtitle: 'How often to update the graph (seconds)',
                adjustment: new Gtk.Adjustment({
                    lower: 0.5,
                    upper: 10.0,
                    step_increment: 0.5,
                    page_increment: 1.0,
                    value: settings.get_double('update-interval'),
                }),
                digits: 1,
            });
            
            settings.bind(
                'update-interval',
                updateIntervalRow,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );
            
            generalGroup.add(updateIntervalRow);
            
            // Graph width setting
            const graphWidthRow = new Adw.SpinRow({
                title: 'Graph Width',
                subtitle: 'Width of the CPU graph in pixels',
                adjustment: new Gtk.Adjustment({
                    lower: 60,
                    upper: 300,
                    step_increment: 10,
                    page_increment: 20,
                    value: settings.get_int('graph-width'),
                }),
                digits: 0,
            });
            
            settings.bind(
                'graph-width',
                graphWidthRow,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );
            
            generalGroup.add(graphWidthRow);
            
            // Graph height setting
            const graphHeightRow = new Adw.SpinRow({
                title: 'Graph Height',
                subtitle: 'Height of the CPU graph in pixels',
                adjustment: new Gtk.Adjustment({
                    lower: 16,
                    upper: 48,
                    step_increment: 2,
                    page_increment: 4,
                    value: settings.get_int('graph-height'),
                }),
                digits: 0,
            });
            
            settings.bind(
                'graph-height',
                graphHeightRow,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );
            
            generalGroup.add(graphHeightRow);
            
            // Bar width setting
            const barWidthRow = new Adw.SpinRow({
                title: 'Bar Width',
                subtitle: 'Width of individual bars in pixels',
                adjustment: new Gtk.Adjustment({
                    lower: 1,
                    upper: 4,
                    step_increment: 1,
                    page_increment: 1,
                    value: settings.get_int('bar-width'),
                }),
                digits: 0,
            });
            
            settings.bind(
                'bar-width',
                barWidthRow,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );
            
            generalGroup.add(barWidthRow);
            
            // Panel position setting
            const panelPositionRow = new Adw.ComboRow({
                title: 'Panel Position',
                subtitle: 'Position in the top panel',
                model: new Gtk.StringList({
                    strings: [
                        'Left',
                        'Center', 
                        'Right'
                    ]
                }),
            });
            
            const positions = ['left', 'center', 'right'];
            const currentPosition = settings.get_string('panel-position');
            panelPositionRow.selected = positions.indexOf(currentPosition);
            
            panelPositionRow.connect('notify::selected', () => {
                const selectedPosition = positions[panelPositionRow.selected];
                settings.set_string('panel-position', selectedPosition);
            });
            
            generalGroup.add(panelPositionRow);
            
            // Appearance group
            const appearanceGroup = new Adw.PreferencesGroup({
                title: 'Appearance',
                description: 'Customize the look of the CPU graph',
            });
            
            page.add(appearanceGroup);
            
            // Show tooltip setting
            const showTooltipRow = new Adw.SwitchRow({
                title: 'Show Tooltip',
                subtitle: 'Display CPU percentage when hovering over the graph',
            });
            
            settings.bind(
                'show-tooltip',
                showTooltipRow,
                'active',
                Gio.SettingsBindFlags.DEFAULT
            );
            
            appearanceGroup.add(showTooltipRow);
            
            // Smooth animation setting
            const smoothAnimationRow = new Adw.SwitchRow({
                title: 'Smooth Animation',
                subtitle: 'Enable smooth scrolling animation for the graph',
            });
            
            settings.bind(
                'smooth-animation',
                smoothAnimationRow,
                'active',
                Gio.SettingsBindFlags.DEFAULT
            );
            
            appearanceGroup.add(smoothAnimationRow);
            
            // Color scheme setting
            const colorSchemeRow = new Adw.ComboRow({
                title: 'Color Scheme',
                subtitle: 'Choose colors for different CPU usage levels',
                model: new Gtk.StringList({
                    strings: [
                        'Default (Green/Blue/Red)',
                        'Monochrome',
                        'Plasma',
                        'Ocean',
                        'Sunset'
                    ]
                }),
            });
            
            const colorSchemes = ['default', 'monochrome', 'plasma', 'ocean', 'sunset'];
            const currentScheme = settings.get_string('color-scheme');
            colorSchemeRow.selected = colorSchemes.indexOf(currentScheme);
            
            colorSchemeRow.connect('notify::selected', () => {
                const selectedScheme = colorSchemes[colorSchemeRow.selected];
                settings.set_string('color-scheme', selectedScheme);
            });
            
            appearanceGroup.add(colorSchemeRow);
            
            // Background style setting
            const backgroundStyleRow = new Adw.ComboRow({
                title: 'Background Style',
                subtitle: 'Choose background appearance for the graph container',
                model: new Gtk.StringList({
                    strings: [
                        'Default',
                        'Transparent',
                        'Dark',
                        'Light',
                        'Glass Effect'
                    ]
                }),
            });
            
            const backgroundStyles = ['default', 'transparent', 'dark', 'light', 'glass'];
            const currentBackground = settings.get_string('background-style');
            backgroundStyleRow.selected = backgroundStyles.indexOf(currentBackground);
            
            backgroundStyleRow.connect('notify::selected', () => {
                const selectedBackground = backgroundStyles[backgroundStyleRow.selected];
                settings.set_string('background-style', selectedBackground);
            });
            
            appearanceGroup.add(backgroundStyleRow);
            
            // Behavior group
            const behaviorGroup = new Adw.PreferencesGroup({
                title: 'Behavior',
                description: 'Configure extension behavior and interactions',
            });
            
            page.add(behaviorGroup);
            
            // Per-core mode setting
            const perCoreModeRow = new Adw.SwitchRow({
                title: 'Per-Core Mode',
                subtitle: 'Show individual CPU cores instead of total usage',
            });
            
            settings.bind(
                'per-core-mode',
                perCoreModeRow,
                'active',
                Gio.SettingsBindFlags.DEFAULT
            );
            
            behaviorGroup.add(perCoreModeRow);
            
            // Click action setting
            const clickActionRow = new Adw.ComboRow({
                title: 'Click Action',
                subtitle: 'Action to perform when clicking the graph',
                model: new Gtk.StringList({
                    strings: [
                        'Open System Monitor',
                        'Open Task Manager',
                        'Show Detailed Popup',
                        'None'
                    ]
                }),
            });
            
            const clickActions = ['system-monitor', 'task-manager', 'detailed-popup', 'none'];
            const currentAction = settings.get_string('click-action');
            clickActionRow.selected = clickActions.indexOf(currentAction);
            
            clickActionRow.connect('notify::selected', () => {
                const selectedAction = clickActions[clickActionRow.selected];
                settings.set_string('click-action', selectedAction);
            });
            
            behaviorGroup.add(clickActionRow);
            
        } catch (e) {
            console.error('Error setting up preferences:', e.message);
            
            // Create a simple error page
            const errorPage = new Adw.PreferencesPage({
                title: 'Error',
                icon_name: 'dialog-error-symbolic',
            });
            
            const errorGroup = new Adw.PreferencesGroup({
                title: 'Configuration Error',
                description: `Failed to load preferences: ${e.message}`,
            });
            
            errorPage.add(errorGroup);
            window.add(errorPage);
        }
    }
}