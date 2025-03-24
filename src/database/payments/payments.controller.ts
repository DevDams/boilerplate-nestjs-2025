import { Controller, Post, Body, UseGuards, Req, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto, CancelSubscriptionDto, PauseSubscriptionDto, ResumeSubscriptionDto } from './dto';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('checkout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a checkout session for payment or subscription' })
    @ApiResponse({ status: 201, description: 'Checkout session created successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async createCheckout(
        @Req() req: RequestWithUser,
        @Body() createCheckoutDto: CreateCheckoutDto,
    ) {
        return this.paymentsService.createCheckout(req.user.id, createCheckoutDto);
    }

    @Get('subscriptions')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all user subscriptions' })
    @ApiResponse({ status: 200, description: 'User subscriptions retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getUserSubscriptions(@Req() req: RequestWithUser) {
        return this.paymentsService.getUserSubscriptions(req.user.id);
    }

    @Get('payments')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all user payments' })
    @ApiResponse({ status: 200, description: 'User payments retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getUserPayments(@Req() req: RequestWithUser) {
        return this.paymentsService.getUserPayments(req.user.id);
    }

    @Post('subscriptions/:id/cancel')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel a subscription' })
    @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Subscription not found' })
    async cancelSubscription(
        @Req() req: RequestWithUser,
        @Param('id') subscriptionId: string,
        @Body() cancelSubscriptionDto: CancelSubscriptionDto,
    ) {
        return this.paymentsService.cancelSubscription(
            req.user.id,
            subscriptionId,
            cancelSubscriptionDto,
        );
    }

    @Post('subscriptions/:id/pause')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Pause a subscription' })
    @ApiResponse({ status: 200, description: 'Subscription paused successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Subscription not found' })
    async pauseSubscription(
        @Req() req: RequestWithUser,
        @Param('id') subscriptionId: string,
        @Body() pauseSubscriptionDto: PauseSubscriptionDto,
    ) {
        return this.paymentsService.pauseSubscription(
            req.user.id,
            subscriptionId,
            pauseSubscriptionDto,
        );
    }

    @Post('subscriptions/:id/resume')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resume a paused subscription' })
    @ApiResponse({ status: 200, description: 'Subscription resumed successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Subscription not found' })
    async resumeSubscription(
        @Req() req: RequestWithUser,
        @Param('id') subscriptionId: string,
    ) {
        return this.paymentsService.resumeSubscription(req.user.id, subscriptionId);
    }

    @Get('subscription-portal')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get customer portal URL for managing subscriptions' })
    @ApiResponse({ status: 200, description: 'Portal URL generated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found or has no subscriptions' })
    async getSubscriptionPortalUrl(@Req() req: RequestWithUser) {
        return this.paymentsService.getSubscriptionPortalUrl(req.user.id);
    }
} 