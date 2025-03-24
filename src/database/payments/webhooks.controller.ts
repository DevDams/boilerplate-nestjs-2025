import { Controller, Post, Body, Headers, RawBodyRequest, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { WebhookDto } from './dto';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('lemon-squeezy')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Handle Lemon Squeezy webhook events' })
    @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid webhook signature or payload' })
    async handleLemonSqueezyWebhook(
        @Headers('x-signature') signature: string,
        @Req() req: RawBodyRequest<Request>,
        @Body() webhookDto: WebhookDto,
    ) {
        // Verify webhook signature
        const rawBody = req.rawBody?.toString() || JSON.stringify(webhookDto);

        if (!this.paymentsService.verifyWebhookSignature(rawBody, signature)) {
            return {
                success: false,
                message: 'Invalid webhook signature',
            };
        }

        return this.paymentsService.handleWebhook(webhookDto);
    }
} 