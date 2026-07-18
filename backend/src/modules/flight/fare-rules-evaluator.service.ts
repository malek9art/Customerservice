import { Injectable, Logger } from '@nestjs/common';
import { BreService } from '../bre/bre.service';

export class EvaluationRequest {
  airlineCode!: string;
  cabinClass!: 'ECONOMY' | 'PREMIUM' | 'BUSINESS' | 'FIRST';
  fareBasisCode?: string;
  basePrice!: number;
  departureDate!: string;
  hoursToDeparture?: number;
}

export interface FareRulesResult {
  airlineCode: string;
  cabinClass: string;
  baggageAllowance: {
    pieces: number;
    maxWeightKg: number;
    description: string;
  };
  cancellationPolicy: {
    isRefundable: boolean;
    penaltyFee: number;
    penaltyCurrency: string;
    refundableAmount: number;
    description: string;
  };
  changePolicy: {
    isChangeable: boolean;
    changeFee: number;
    description: string;
  };
  pricingBreakdown: {
    basePrice: number;
    agencyMarkup: number;
    finalPrice: number;
    currency: string;
  };
}

@Injectable()
export class FareRulesEvaluatorService {
  private readonly logger = new Logger(FareRulesEvaluatorService.name);

  constructor(private bre: BreService) {}

  async evaluateFareRules(
    companyId: string,
    req: EvaluationRequest,
  ): Promise<FareRulesResult> {
    this.logger.log(`Evaluating fare rules for airline ${req.airlineCode}, class ${req.cabinClass}`);

    const breOutcome = await this.bre.evaluate(companyId, 'FARE_RULES', req);

    const defaultBaggage =
      req.cabinClass === 'BUSINESS' || req.cabinClass === 'FIRST'
        ? { pieces: 2, maxWeightKg: 32, description: '2 Check-in Bags up to 32kg each + 15kg Hand Bag' }
        : req.cabinClass === 'PREMIUM'
        ? { pieces: 2, maxWeightKg: 23, description: '2 Check-in Bags up to 23kg each + 10kg Hand Bag' }
        : { pieces: 1, maxWeightKg: 23, description: '1 Check-in Bag up to 23kg + 7kg Hand Bag' };

    const hoursLeft = req.hoursToDeparture !== undefined ? req.hoursToDeparture : 120;
    const isNonRefundable = hoursLeft < 24 && req.cabinClass === 'ECONOMY';

    const penaltyFee = isNonRefundable ? req.basePrice : Math.min(100, req.basePrice * 0.2);
    const changeFee = Math.min(50, req.basePrice * 0.1);

    const markupRate = breOutcome?.markupPercentage !== undefined ? breOutcome.markupPercentage : 0.05;
    const agencyMarkup = req.basePrice * markupRate;
    const finalPrice = req.basePrice + agencyMarkup;

    return {
      airlineCode: req.airlineCode,
      cabinClass: req.cabinClass,
      baggageAllowance: breOutcome?.baggage || defaultBaggage,
      cancellationPolicy: {
        isRefundable: !isNonRefundable,
        penaltyFee,
        penaltyCurrency: 'USD',
        refundableAmount: Math.max(0, req.basePrice - penaltyFee),
        description: isNonRefundable
          ? 'Non-refundable within 24 hours of departure'
          : `Refundable subject to $${penaltyFee} cancellation penalty`,
      },
      changePolicy: {
        isChangeable: true,
        changeFee,
        description: `Date/Flight change permitted subject to $${changeFee} change fee plus fare difference`,
      },
      pricingBreakdown: {
        basePrice: req.basePrice,
        agencyMarkup,
        finalPrice,
        currency: 'USD',
      },
    };
  }
}
