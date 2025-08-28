"""
AI报告解读服务
基于第三方AI分析结果生成专业的医疗报告
"""

import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

from app.core.config import settings

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    """风险等级"""
    LOW = "低风险"
    MEDIUM = "中等风险"
    HIGH = "高风险"
    CRITICAL = "严重风险"


class AnalysisType(Enum):
    """分析类型"""
    ORAL_CLASSIFICATION = "oral_classification"
    CEPHALOMETRIC_17 = "cephalometric_17"
    CEPHALOMETRIC_57 = "cephalometric_57"
    PANORAMIC_SEGMENTATION = "panoramic_segmentation"
    LESION_DETECTION = "lesion_detection"
    STL_SEGMENTATION = "stl_segmentation"
    GROWTH_DIRECTION = "growth_direction"


@dataclass
class Finding:
    """发现项"""
    category: str
    description: str
    severity: str
    confidence: float
    location: Optional[str] = None
    measurement: Optional[Dict[str, Any]] = None


@dataclass
class Recommendation:
    """建议项"""
    type: str  # treatment, followup, referral
    priority: str  # urgent, high, medium, low
    description: str
    timeline: Optional[str] = None


@dataclass
class ReportSummary:
    """报告摘要"""
    overall_risk: RiskLevel
    key_findings: List[Finding]
    recommendations: List[Recommendation]
    followup_needed: bool
    emergency_referral: bool


class ReportInterpreter:
    """AI报告解读器"""
    
    def __init__(self):
        self.confidence_threshold = settings.MIN_CONFIDENCE_THRESHOLD
        self.risk_assessor = RiskAssessment()
        self.recommendation_engine = RecommendationEngine()
    
    async def interpret_analysis_results(
        self,
        analysis_results: Dict[str, Any],
        analysis_type: str,
        patient_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        解读分析结果并生成报告
        """
        try:
            logger.info(f"开始解读分析结果: {analysis_type}")
            
            # 根据分析类型选择解读策略
            interpreter_method = self._get_interpreter_method(analysis_type)
            
            # 解读分析结果
            findings = await interpreter_method(analysis_results, patient_info)
            
            # 风险评估
            risk_level = self.risk_assessor.assess_overall_risk(findings)
            
            # 生成建议
            recommendations = self.recommendation_engine.generate_recommendations(
                findings, risk_level, patient_info
            )
            
            # 生成报告摘要
            summary = ReportSummary(
                overall_risk=risk_level,
                key_findings=findings,
                recommendations=recommendations,
                followup_needed=self._needs_followup(findings),
                emergency_referral=self._needs_emergency_referral(findings)
            )
            
            # 构建完整报告
            report = {
                "analysis_type": analysis_type,
                "patient_id": patient_info.get("id"),
                "analysis_date": datetime.now().isoformat(),
                "summary": self._serialize_summary(summary),
                "detailed_findings": self._serialize_findings(findings),
                "recommendations": self._serialize_recommendations(recommendations),
                "risk_assessment": {
                    "overall_level": risk_level.value,
                    "factors": self._get_risk_factors(findings)
                },
                "quality_metrics": {
                    "confidence_score": self._calculate_average_confidence(findings),
                    "data_completeness": self._assess_data_completeness(analysis_results)
                },
                "metadata": {
                    "interpreter_version": "2.0.0",
                    "processing_time": datetime.now().isoformat()
                }
            }
            
            logger.info(f"报告解读完成: {analysis_type}")
            return report
            
        except Exception as e:
            logger.error(f"报告解读失败: {str(e)}")
            raise
    
    def _get_interpreter_method(self, analysis_type: str):
        """获取对应的解读方法"""
        method_map = {
            "oral_classification": self._interpret_oral_classification,
            "cephalometric_17": self._interpret_cephalometric_17,
            "cephalometric_57": self._interpret_cephalometric_57,
            "panoramic_segmentation": self._interpret_panoramic_segmentation,
            "lesion_detection": self._interpret_lesion_detection,
            "stl_segmentation": self._interpret_stl_segmentation,
            "growth_direction": self._interpret_growth_direction,
        }
        
        return method_map.get(analysis_type, self._interpret_generic)
    
    # ========== 具体分析类型的解读方法 ==========
    
    async def _interpret_oral_classification(
        self, 
        results: Dict[str, Any], 
        patient_info: Dict[str, Any]
    ) -> List[Finding]:
        """解读口腔图像分类结果"""
        findings = []
        
        if "data" in results:
            data = results["data"]
            confidence = data.get("confidence", 0)
            image_type = data.get("image_type")
            posture = data.get("posture")
            
            # 基础发现
            findings.append(Finding(
                category="图像质量",
                description=f"识别为{image_type}图像，姿态为{posture}",
                severity="信息",
                confidence=confidence
            ))
            
            # 质量评估
            if confidence < 0.8:
                findings.append(Finding(
                    category="图像质量",
                    description="图像质量需要改进，可能影响分析准确性",
                    severity="注意",
                    confidence=confidence
                ))
        
        return findings
    
    async def _interpret_cephalometric_17(
        self, 
        results: Dict[str, Any], 
        patient_info: Dict[str, Any]
    ) -> List[Finding]:
        """解读头颅侧位片17关键点分析结果"""
        findings = []
        
        if "data" in results and "measurements" in results["data"]:
            measurements = results["data"]["measurements"]
            patient_age = patient_info.get("age", 10)
            
            # SNA角度分析
            sna = measurements.get("SNA")
            if sna:
                if sna < 78:
                    findings.append(Finding(
                        category="颅面关系",
                        description=f"SNA角度偏小({sna}°)，提示上颌后退",
                        severity="中等",
                        confidence=0.9,
                        measurement={"SNA": sna, "normal_range": "78-84°"}
                    ))
                elif sna > 84:
                    findings.append(Finding(
                        category="颅面关系", 
                        description=f"SNA角度偏大({sna}°)，提示上颌前突",
                        severity="中等",
                        confidence=0.9,
                        measurement={"SNA": sna, "normal_range": "78-84°"}
                    ))
            
            # SNB角度分析
            snb = measurements.get("SNB")
            if snb:
                if snb < 76:
                    findings.append(Finding(
                        category="颅面关系",
                        description=f"SNB角度偏小({snb}°)，提示下颌后退",
                        severity="中等",
                        confidence=0.9,
                        measurement={"SNB": snb, "normal_range": "76-82°"}
                    ))
                elif snb > 82:
                    findings.append(Finding(
                        category="颅面关系",
                        description=f"SNB角度偏大({snb}°)，提示下颌前突", 
                        severity="中等",
                        confidence=0.9,
                        measurement={"SNB": snb, "normal_range": "76-82°"}
                    ))
            
            # ANB角度分析
            anb = measurements.get("ANB")
            if anb:
                if anb < 0:
                    findings.append(Finding(
                        category="颌骨关系",
                        description=f"ANB角度为负值({anb}°)，提示III类骨性关系",
                        severity="高",
                        confidence=0.95,
                        measurement={"ANB": anb, "normal_range": "2-4°"}
                    ))
                elif anb > 6:
                    findings.append(Finding(
                        category="颌骨关系",
                        description=f"ANB角度偏大({anb}°)，提示II类骨性关系",
                        severity="高",
                        confidence=0.95,
                        measurement={"ANB": anb, "normal_range": "2-4°"}
                    ))
        
        return findings
    
    async def _interpret_panoramic_segmentation(
        self, 
        results: Dict[str, Any], 
        patient_info: Dict[str, Any]
    ) -> List[Finding]:
        """解读全景片分割结果"""
        findings = []
        
        if "data" in results:
            data = results["data"]
            teeth_data = data.get("teeth", {})
            
            # 分析每颗牙齿
            for tooth_number, tooth_info in teeth_data.items():
                condition = tooth_info.get("condition", "normal")
                confidence = tooth_info.get("confidence", 0)
                
                if condition != "normal" and confidence > self.confidence_threshold:
                    severity = self._map_condition_to_severity(condition)
                    findings.append(Finding(
                        category="牙齿状况",
                        description=f"牙齿{tooth_number}: {condition}",
                        severity=severity,
                        confidence=confidence,
                        location=f"牙位{tooth_number}"
                    ))
            
            # 缺失牙分析
            missing_teeth = data.get("missing_teeth", [])
            if missing_teeth:
                findings.append(Finding(
                    category="牙齿缺失",
                    description=f"检测到{len(missing_teeth)}颗缺失牙: {', '.join(missing_teeth)}",
                    severity="中等",
                    confidence=0.9
                ))
        
        return findings
    
    async def _interpret_lesion_detection(
        self, 
        results: Dict[str, Any], 
        patient_info: Dict[str, Any]
    ) -> List[Finding]:
        """解读病变检测结果"""
        findings = []
        
        if "data" in results and "lesions" in results["data"]:
            lesions = results["data"]["lesions"]
            
            for lesion in lesions:
                lesion_type = lesion.get("type", "未知病变")
                confidence = lesion.get("confidence", 0)
                location = lesion.get("location", "未指定位置")
                severity = lesion.get("severity", "unknown")
                
                if confidence > self.confidence_threshold:
                    findings.append(Finding(
                        category="病变检测",
                        description=f"在{location}发现{lesion_type}",
                        severity=self._map_lesion_severity(severity),
                        confidence=confidence,
                        location=location
                    ))
        
        return findings
    
    async def _interpret_generic(
        self, 
        results: Dict[str, Any], 
        patient_info: Dict[str, Any]
    ) -> List[Finding]:
        """通用解读方法"""
        findings = []
        
        # 基础信息提取
        if "data" in results:
            findings.append(Finding(
                category="分析结果",
                description="AI分析已完成，请查看详细数据",
                severity="信息",
                confidence=results.get("confidence", 0.5)
            ))
        
        return findings
    
    # ========== 辅助方法 ==========
    
    def _map_condition_to_severity(self, condition: str) -> str:
        """映射牙齿状况到严重程度"""
        severity_map = {
            "caries": "中等",
            "deep_caries": "高",
            "pulpitis": "高",
            "periapical": "严重",
            "crown": "信息",
            "filling": "信息",
            "root_canal": "信息"
        }
        return severity_map.get(condition.lower(), "注意")
    
    def _map_lesion_severity(self, severity: str) -> str:
        """映射病变严重程度"""
        severity_map = {
            "mild": "低",
            "moderate": "中等", 
            "severe": "高",
            "critical": "严重"
        }
        return severity_map.get(severity.lower(), "中等")
    
    def _needs_followup(self, findings: List[Finding]) -> bool:
        """判断是否需要随访"""
        high_severity_count = len([f for f in findings if f.severity in ["高", "严重"]])
        return high_severity_count > 0
    
    def _needs_emergency_referral(self, findings: List[Finding]) -> bool:
        """判断是否需要紧急转诊"""
        critical_findings = [f for f in findings if f.severity == "严重"]
        return len(critical_findings) > 0
    
    def _calculate_average_confidence(self, findings: List[Finding]) -> float:
        """计算平均置信度"""
        if not findings:
            return 0.0
        return sum(f.confidence for f in findings) / len(findings)
    
    def _assess_data_completeness(self, results: Dict[str, Any]) -> float:
        """评估数据完整性"""
        # 简化的完整性评估
        if "data" in results and results["data"]:
            return 0.9
        return 0.5
    
    def _get_risk_factors(self, findings: List[Finding]) -> List[str]:
        """提取风险因素"""
        risk_factors = []
        
        for finding in findings:
            if finding.severity in ["高", "严重"]:
                risk_factors.append(f"{finding.category}: {finding.description}")
        
        return risk_factors
    
    def _serialize_summary(self, summary: ReportSummary) -> Dict[str, Any]:
        """序列化报告摘要"""
        return {
            "overall_risk": summary.overall_risk.value,
            "key_findings_count": len(summary.key_findings),
            "recommendations_count": len(summary.recommendations),
            "followup_needed": summary.followup_needed,
            "emergency_referral": summary.emergency_referral
        }
    
    def _serialize_findings(self, findings: List[Finding]) -> List[Dict[str, Any]]:
        """序列化发现项"""
        return [
            {
                "category": f.category,
                "description": f.description,
                "severity": f.severity,
                "confidence": f.confidence,
                "location": f.location,
                "measurement": f.measurement
            }
            for f in findings
        ]
    
    def _serialize_recommendations(self, recommendations: List[Recommendation]) -> List[Dict[str, Any]]:
        """序列化建议项"""
        return [
            {
                "type": r.type,
                "priority": r.priority,
                "description": r.description,
                "timeline": r.timeline
            }
            for r in recommendations
        ]


class RiskAssessment:
    """风险评估器"""
    
    def assess_overall_risk(self, findings: List[Finding]) -> RiskLevel:
        """评估整体风险等级"""
        if not findings:
            return RiskLevel.LOW
        
        severity_scores = {
            "信息": 0,
            "注意": 1,
            "低": 1,
            "中等": 2,
            "高": 3,
            "严重": 4
        }
        
        # 计算风险分数
        total_score = sum(severity_scores.get(f.severity, 1) for f in findings)
        max_score = max(severity_scores.get(f.severity, 1) for f in findings)
        
        # 基于最高严重度和总分评估
        if max_score >= 4:
            return RiskLevel.CRITICAL
        elif max_score >= 3 or total_score >= 6:
            return RiskLevel.HIGH
        elif max_score >= 2 or total_score >= 3:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW


class RecommendationEngine:
    """建议生成引擎"""
    
    def generate_recommendations(
        self, 
        findings: List[Finding], 
        risk_level: RiskLevel,
        patient_info: Dict[str, Any]
    ) -> List[Recommendation]:
        """生成治疗建议"""
        recommendations = []
        
        # 基于风险等级的通用建议
        if risk_level == RiskLevel.CRITICAL:
            recommendations.append(Recommendation(
                type="referral",
                priority="urgent",
                description="建议立即转诊至专科医院进行进一步评估和治疗",
                timeline="立即"
            ))
        
        # 基于具体发现的建议
        for finding in findings:
            recs = self._get_finding_specific_recommendations(finding, patient_info)
            recommendations.extend(recs)
        
        # 通用随访建议
        if risk_level in [RiskLevel.MEDIUM, RiskLevel.HIGH]:
            recommendations.append(Recommendation(
                type="followup",
                priority="medium", 
                description="建议3-6个月后复查，监测病情进展",
                timeline="3-6个月"
            ))
        
        return recommendations
    
    def _get_finding_specific_recommendations(
        self, 
        finding: Finding, 
        patient_info: Dict[str, Any]
    ) -> List[Recommendation]:
        """基于具体发现生成建议"""
        recommendations = []
        
        if "龋齿" in finding.description or "caries" in finding.description.lower():
            recommendations.append(Recommendation(
                type="treatment",
                priority="medium",
                description="建议及时进行充填治疗，防止龋坏进一步发展",
                timeline="2-4周内"
            ))
        
        if "缺失" in finding.description:
            recommendations.append(Recommendation(
                type="treatment",
                priority="low",
                description="评估是否需要间隙维持或修复治疗",
                timeline="1-3个月内"
            ))
        
        if finding.severity == "严重":
            recommendations.append(Recommendation(
                type="referral",
                priority="high",
                description=f"针对{finding.category}问题，建议转诊专科医生",
                timeline="1-2周内"
            ))
        
        return recommendations


# 创建全局解读器实例
report_interpreter = ReportInterpreter()
