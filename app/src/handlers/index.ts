import { register } from '../registry.js';

import { handleDemoPlc } from './demo-plc.js';
import { handleDemoModbus } from './demo-modbus.js';
import { handleEdge5ModbusV2 } from './edge5-modbus-v2.js';
import { handleEdge5Video } from './edge5-video.js';

import { handle as interpretation } from './edge5i-modbus.js';
import { handle as cdab} from './edge5cdab-modbus.js';

const DEMO_PLC_TOPIC = 'data/demo/plc/v1';
const DEMO_MODBUS_TOPIC = 'data/demo/modbus/v1';
const EDGE5_MODBUS_TOPIC = 'data/edge5/modbus/v2';
const EDGE5_VIDEO_TOPIC = 'data/edge5/video/v1';

register(DEMO_PLC_TOPIC, handleDemoPlc);
register(DEMO_MODBUS_TOPIC, handleDemoModbus);
register(EDGE5_MODBUS_TOPIC, handleEdge5ModbusV2);
register(EDGE5_VIDEO_TOPIC, handleEdge5Video);

register('data/edge5i/modbus', interpretation);
register('data/edge5cdab/modbus', cdab);
