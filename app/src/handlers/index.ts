import { register } from '../registry.js'
import { handleDemoModbus, TOPIC as demoModbus } from './demo-modbus.js'
import { handleDemoPlc, TOPIC as demoPlc } from './demo-plc.js'
import { handleEdge5Modbus, TOPIC as edge5Modbus } from './edge5-modbus.js'
import {
  handleEdge5ModbusV2,
  TOPIC as edge5ModbusV2,
} from './edge5-modbus-v2.js'
import { handleEdge5Video, TOPIC as edge5Video } from './edge5-video.js'

register(demoModbus, handleDemoModbus)
register(demoPlc, handleDemoPlc)
register(edge5Modbus, handleEdge5Modbus)
register(edge5ModbusV2, handleEdge5ModbusV2)
register(edge5Video, handleEdge5Video)
