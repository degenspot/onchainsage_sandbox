import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ScenarioModelingService } from '../services/scenario-modeling.service';
import { MarketSimulatorService } from '../services/market-simulator.service';
import { RiskAssessmentService } from '../services/risk-assessment.service';
import { StressTestingService } from '../services/stress-testing.service';
import { VisualizationService } from '../services/visualization.service';
import { AlertService } from '../services/alert.service';
import { CreateScenarioDto, MarketSimulationDto, StressTestDto } from '../dto';
import { ScenarioParameters, AlertConfiguration } from '../interfaces/scenario-analysis.interfaces';

@ApiTags('Scenario Analysis')
@Controller('scenario-analysis')
@ApiBearerAuth()
export class ScenarioAnalysisController {
  constructor(
    private scenarioModelingService: ScenarioModelingService,
    private marketSimulatorService: MarketSimulatorService,
    private riskAssessmentService: RiskAssessmentService,
    private stressTestingService: StressTestingService,
    private visualizationService: VisualizationService,
    private alertService: AlertService,
  ) {}

  @Post('scenarios')
  @ApiOperation({ summary: 'Create a new scenario' })
  @ApiResponse({ status: 201, description: 'Scenario created successfully' })
  async createScenario(@Body() createScenarioDto: CreateScenarioDto) {
    try {
      const scenarioParameters: ScenarioParameters = {
        name: createScenarioDto.name,
        description: createScenarioDto.description,
        duration: createScenarioDto.duration,
        marketConditions: createScenarioDto.marketConditions,
        strategies: createScenarioDto.strategies,
      };

      const scenario = await this.scenarioModelingService.createScenario(scenarioParameters);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Scenario created successfully',
        data: scenario,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create scenario: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('scenarios/:id/run')
  @ApiOperation({ summary: 'Run a scenario analysis' })
  @ApiResponse({ status: 200, description: 'Scenario analysis completed' })
  async runScenario(@Param('id') scenarioId: string) {
    try {
      const result = await this.scenarioModelingService.runScenario(scenarioId);
      return {
        statusCode: HttpStatus.OK,
        message: 'Scenario analysis completed',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to run scenario: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('scenarios')
  @ApiOperation({ summary: 'Get all scenarios' })
  @ApiResponse({ status: 200, description: 'Scenarios retrieved successfully' })
  async getAllScenarios() {
    try {
      const scenarios = await this.scenarioModelingService.getAllScenarios();
      return {
        statusCode: HttpStatus.OK,
        message: 'Scenarios retrieved successfully',
        data: scenarios,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve scenarios: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('scenarios/:id')
  @ApiOperation({ summary: 'Get scenario by ID' })
  @ApiResponse({ status: 200, description: 'Scenario retrieved successfully' })
  async getScenario(@Param('id') scenarioId: string) {
    try {
      const scenario = await this.scenarioModelingService.getScenario(scenarioId);
      if (!scenario) {
        throw new HttpException('Scenario not found', HttpStatus.NOT_FOUND);
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Scenario retrieved successfully',
        data: scenario,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve scenario',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('scenarios/:id')
  @ApiOperation({ summary: 'Delete scenario' })
  @ApiResponse({ status: 200, description: 'Scenario deleted successfully' })
  async deleteScenario(@Param('id') scenarioId: string) {
    try {
      await this.scenarioModelingService.deleteScenario(scenarioId);
      return {
        statusCode: HttpStatus.OK,
        message: 'Scenario deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to delete scenario: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('market-simulation')
  @ApiOperation({ summary: 'Run market simulation' })
  @ApiResponse({ status: 200, description: 'Market simulation completed' })
  async runMarketSimulation(@Body() simulationDto: MarketSimulationDto) {
    try {
      let prices: number[];

      switch (simulationDto.model) {
        case 'jump_diffusion':
          prices = await this.marketSimulatorService.simulateJumpDiffusion(
            simulationDto.initialPrice,
            simulationDto.drift,
            simulationDto.volatility,
            0.1, // Jump intensity
            -0.05, // Jump mean
            0.1, // Jump std
            simulationDto.timeHorizon,
            simulationDto.steps,
          );
          break;
        default:
          prices = await this.marketSimulatorService.simulateGeometricBrownianMotion(
            simulationDto.initialPrice,
            simulationDto.drift,
            simulationDto.volatility,
            simulationDto.timeHorizon,
            simulationDto.steps,
          );
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Market simulation completed',
        data: {
          symbol: simulationDto.symbol,
          prices,
          parameters: simulationDto,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Market simulation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('stress-tests')
  @ApiOperation({ summary: 'Run stress test' })
  @ApiResponse({ status: 200, description: 'Stress test completed' })
  async runStressTest(@Body() stressTestDto: StressTestDto) {
    try {
      const result = await this.stressTestingService.runStressTest(
        stressTestDto.scenarioId,
        {
          name: stressTestDto.name,
          type: stressTestDto.type,
          severity: stressTestDto.severity,
          parameters: stressTestDto.parameters,
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Stress test completed',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        `Stress test failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stress-tests/templates')
  @ApiOperation({ summary: 'Get stress test templates' })
  @ApiResponse({ status: 200, description: 'Stress test templates retrieved' })
  async getStressTestTemplates() {
    try {
      const templates = await this.stressTestingService.getStressTestTemplates();
      return {
        statusCode: HttpStatus.OK,
        message: 'Stress test templates retrieved',
        data: templates,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve templates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('scenarios/:id/risk-assessment')
  @ApiOperation({ summary: 'Get risk assessment for scenario' })
  @ApiResponse({ status: 200, description: 'Risk assessment retrieved' })
  async getRiskAssessment(@Param('id') scenarioId: string) {
    try {
      const assessment = await this.riskAssessmentService.getRiskAssessment(scenarioId);
      return {
        statusCode: HttpStatus.OK,
        message: 'Risk assessment retrieved',
        data: assessment,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve risk assessment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('scenarios/:id/visualization')
  @ApiOperation({ summary: 'Get visualization data for scenario' })
  @ApiResponse({ status: 200, description: 'Visualization data retrieved' })
  async getVisualizationData(@Param('id') scenarioId: string) {
    try {
      const scenario = await this.scenarioModelingService.getScenario(scenarioId);
      if (!scenario || !scenario.results) {
        throw new HttpException('Scenario results not found', HttpStatus.NOT_FOUND);
      }

      const visualizationData = await this.visualizationService.generateVisualizationData(
        scenarioId,
        scenario.results,
      );

      const chartConfig = await this.visualizationService.generateChartConfig(visualizationData);

      return {
        statusCode: HttpStatus.OK,
        message: 'Visualization data retrieved',
        data: {
          visualizationData,
          chartConfig,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate visualization',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Create risk alert' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  async createAlert(
    @Body() alertConfig: AlertConfiguration,
    @Query('userId') userId: string,
  ) {
    try {
      const alert = await this.alertService.createAlert(userId, alertConfig);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Alert created successfully',
        data: alert,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create alert: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('alerts/templates')
  @ApiOperation({ summary: 'Get default alert templates' })
  @ApiResponse({ status: 200, description: 'Alert templates retrieved' })
  async getAlertTemplates() {
    try {
      const templates = await this.alertService.getDefaultAlertTemplates();
      return {
        statusCode: HttpStatus.OK,
        message: 'Alert templates retrieved',
        data: templates,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve alert templates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get user alerts' })
  @ApiResponse({ status: 200, description: 'User alerts retrieved' })
  async getUserAlerts(@Query('userId') userId: string) {
    try {
      const alerts = await this.alertService.getUserAlerts(userId);
      return {
        statusCode: HttpStatus.OK,
        message: 'User alerts retrieved',
        data: alerts,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve alerts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('alerts/:id')
  @ApiOperation({ summary: 'Update alert' })
  @ApiResponse({ status: 200, description: 'Alert updated successfully' })
  async updateAlert(
    @Param('id') alertId: string,
    @Body() updates: Partial<AlertConfiguration>,
    @Query('userId') userId: string,
  ) {
    try {
      const alert = await this.alertService.updateAlert(userId, alertId, updates);
      return {
        statusCode: HttpStatus.OK,
        message: 'Alert updated successfully',
        data: alert,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update alert',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('alerts/:id')
  @ApiOperation({ summary: 'Delete alert' })
  @ApiResponse({ status: 200, description: 'Alert deleted successfully' })
  async deleteAlert(
    @Param('id') alertId: string,
    @Query('userId') userId: string,
  ) {
    try {
      await this.alertService.deleteAlert(userId, alertId);
      return {
        statusCode: HttpStatus.OK,
        message: 'Alert deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to delete alert: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
