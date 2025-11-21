import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, Text } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { RootStackParamList } from '../navigation/types';
import { FormField } from '../components/forms/FormField';
import { FormSection } from '../components/forms/FormSection';
import { Picker, PickerItem } from '../components/common/Picker';
import { Switch } from '../components/common/Switch';
import { Button } from '../components/common/Button';
import { InspectionOrder, MeasurementPoint, MeasurementResult, ResultInput } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getOrder } from '../services/order';
import { getPoint } from '../services/point';
import { createOrUpdateResult, getResultByPoint } from '../services/result';
import { 
  webGetOrder, 
  webGetPoint,
  webGetResultByPoint,
  webCreateResult,
  initWebStorage 
} from '../services/webStorage';
import { validateNumeric, validateRange } from '../utils/validators';
import { translations as t } from '../constants';

type MeasurementFormScreenRouteProp = RouteProp<RootStackParamList, 'MeasurementFormScreen'>;
type MeasurementFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MeasurementFormScreen'>;

interface MeasurementFormData {
  // Loop Impedance
  loopImpedance?: string;
  loopResultPass?: boolean;
  
  // Insulation
  insulationLn?: string;
  insulationLpe?: string;
  insulationNpe?: string;
  insulationResultPass?: boolean;
  
  // RCD
  rcdType?: string;
  rcdRatedCurrent?: string;
  rcdTime1x?: string;
  rcdTime5x?: string;
  rcdResultPass?: boolean;
  
  // PE Continuity
  peResistance?: string;
  peResultPass?: boolean;
  
  // Earthing
  earthingResistance?: string;
  earthingResultPass?: boolean;
  
  // Polarity/Phase
  polarityOk?: boolean;
  phaseSequenceOk?: boolean;
  
  // Breakers
  breakerCheckOk?: boolean;
  
  // LPS
  lpsEarthingResistance?: string;
  lpsContinuityOk?: boolean;
  lpsVisualOk?: boolean;
  
  // Comments
  comments?: string;
}

export const MeasurementFormScreen: React.FC = () => {
  const route = useRoute<MeasurementFormScreenRouteProp>();
  const navigation = useNavigation<MeasurementFormScreenNavigationProp>();
  const { orderId, pointId } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [order, setOrder] = useState<InspectionOrder | null>(null);
  const [point, setPoint] = useState<MeasurementPoint | null>(null);
  const isWeb = Platform.OS === 'web';

  // Helper function to get translated point type label
  const getPointTypeLabel = (type: string): string => {
    switch (type) {
      case 'socket_1p':
        return t.pointTypes.socket_1p;
      case 'socket_3p':
        return t.pointTypes.socket_3p;
      case 'lighting':
        return t.pointTypes.lighting;
      case 'rcd':
        return t.pointTypes.rcd;
      case 'earthing':
        return t.pointTypes.earthing;
      case 'lps':
        return t.pointTypes.lps;
      case 'other':
        return t.pointTypes.other;
      default:
        return type;
    }
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<MeasurementFormData>({
    defaultValues: {
      loopImpedance: '',
      loopResultPass: false,
      insulationLn: '',
      insulationLpe: '',
      insulationNpe: '',
      insulationResultPass: false,
      rcdType: '',
      rcdRatedCurrent: '',
      rcdTime1x: '',
      rcdTime5x: '',
      rcdResultPass: false,
      peResistance: '',
      peResultPass: false,
      earthingResistance: '',
      earthingResultPass: false,
      polarityOk: false,
      phaseSequenceOk: false,
      breakerCheckOk: false,
      lpsEarthingResistance: '',
      lpsContinuityOk: false,
      lpsVisualOk: false,
      comments: '',
    },
  });

  // Load order, point, and existing result data
  useEffect(() => {
    const loadData = async () => {
      try {
        setInitialLoading(true);
        
        let loadedOrder: InspectionOrder | null = null;
        let loadedPoint: MeasurementPoint | null = null;
        
        if (isWeb) {
          initWebStorage();
          loadedOrder = webGetOrder(orderId);
          loadedPoint = webGetPoint(pointId);
        } else {
          loadedOrder = await getOrder(orderId);
          loadedPoint = await getPoint(pointId);
        }
        
        if (!loadedOrder) {
          Alert.alert('Error', 'Inspection order not found');
          navigation.goBack();
          return;
        }
        
        if (!loadedPoint) {
          Alert.alert('Error', 'Measurement point not found');
          navigation.goBack();
          return;
        }
        
        setOrder(loadedOrder);
        setPoint(loadedPoint);
        
        // Load existing result if available
        let existingResult = null;
        if (isWeb) {
          existingResult = webGetResultByPoint(pointId);
        } else {
          existingResult = await getResultByPoint(pointId);
        }
        
        if (existingResult) {
          // Populate form with existing data
          setValue('loopImpedance', existingResult.loopImpedance?.toString() ?? '');
          setValue('loopResultPass', existingResult.loopResultPass ?? false);
          setValue('insulationLn', existingResult.insulationLn?.toString() ?? '');
          setValue('insulationLpe', existingResult.insulationLpe?.toString() ?? '');
          setValue('insulationNpe', existingResult.insulationNpe?.toString() ?? '');
          setValue('insulationResultPass', existingResult.insulationResultPass ?? false);
          setValue('rcdType', existingResult.rcdType ?? '');
          setValue('rcdRatedCurrent', existingResult.rcdRatedCurrent?.toString() ?? '');
          setValue('rcdTime1x', existingResult.rcdTime1x?.toString() ?? '');
          setValue('rcdTime5x', existingResult.rcdTime5x?.toString() ?? '');
          setValue('rcdResultPass', existingResult.rcdResultPass ?? false);
          setValue('peResistance', existingResult.peResistance?.toString() ?? '');
          setValue('peResultPass', existingResult.peResultPass ?? false);
          setValue('earthingResistance', existingResult.earthingResistance?.toString() ?? '');
          setValue('earthingResultPass', existingResult.earthingResultPass ?? false);
          setValue('polarityOk', existingResult.polarityOk ?? false);
          setValue('phaseSequenceOk', existingResult.phaseSequenceOk ?? false);
          setValue('breakerCheckOk', existingResult.breakerCheckOk ?? false);
          setValue('lpsEarthingResistance', existingResult.lpsEarthingResistance?.toString() ?? '');
          setValue('lpsContinuityOk', existingResult.lpsContinuityOk ?? false);
          setValue('lpsVisualOk', existingResult.lpsVisualOk ?? false);
          setValue('comments', existingResult.comments ?? '');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data');
        navigation.goBack();
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [orderId, pointId, navigation, setValue, isWeb]);

  const onSubmit = async (data: MeasurementFormData) => {
    try {
      setLoading(true);

      // Prepare result input - only include fields that are in scope
      const resultInput: ResultInput = {
        measurementPointId: pointId,
      };

      // Helper function to check if measurement is relevant
      const isRelevant = (measurementType: string): boolean => {
        if (!point) return false;
        
        switch (point.type) {
          case 'socket_1p':
            return ['loopImpedance', 'polarity'].includes(measurementType);
          case 'socket_3p':
            return ['loopImpedance', 'phaseSequence'].includes(measurementType);
          case 'lighting':
            return ['loopImpedance', 'polarity'].includes(measurementType);
          case 'rcd':
            return ['rcd'].includes(measurementType);
          case 'earthing':
            return ['earthing', 'peContinuity'].includes(measurementType);
          case 'lps':
            return ['lps'].includes(measurementType);
          case 'other':
            return true;
          default:
            return true;
        }
      };

      // Loop Impedance
      if (order?.measureLoopImpedance && isRelevant('loopImpedance')) {
        resultInput.loopImpedance = data.loopImpedance ? parseFloat(data.loopImpedance) : undefined;
        resultInput.loopResultPass = data.loopResultPass;
      }

      // Insulation
      if (order?.measureInsulation && isRelevant('insulation')) {
        resultInput.insulationLn = data.insulationLn ? parseFloat(data.insulationLn) : undefined;
        resultInput.insulationLpe = data.insulationLpe ? parseFloat(data.insulationLpe) : undefined;
        resultInput.insulationNpe = data.insulationNpe ? parseFloat(data.insulationNpe) : undefined;
        resultInput.insulationResultPass = data.insulationResultPass;
      }

      // RCD
      if (order?.measureRcd && isRelevant('rcd')) {
        resultInput.rcdType = data.rcdType || undefined;
        resultInput.rcdRatedCurrent = data.rcdRatedCurrent ? parseFloat(data.rcdRatedCurrent) : undefined;
        resultInput.rcdTime1x = data.rcdTime1x ? parseFloat(data.rcdTime1x) : undefined;
        resultInput.rcdTime5x = data.rcdTime5x ? parseFloat(data.rcdTime5x) : undefined;
        resultInput.rcdResultPass = data.rcdResultPass;
      }

      // PE Continuity
      if (order?.measurePeContinuity && isRelevant('peContinuity')) {
        resultInput.peResistance = data.peResistance ? parseFloat(data.peResistance) : undefined;
        resultInput.peResultPass = data.peResultPass;
      }

      // Earthing
      if (order?.measureEarthing && isRelevant('earthing')) {
        resultInput.earthingResistance = data.earthingResistance ? parseFloat(data.earthingResistance) : undefined;
        resultInput.earthingResultPass = data.earthingResultPass;
      }

      // Polarity/Phase
      if (order?.measurePolarity && isRelevant('polarity')) {
        resultInput.polarityOk = data.polarityOk;
      }
      if (order?.measurePhaseSequence && isRelevant('phaseSequence')) {
        resultInput.phaseSequenceOk = data.phaseSequenceOk;
      }

      // Breakers
      if (order?.measureBreakersCheck && isRelevant('breakers')) {
        resultInput.breakerCheckOk = data.breakerCheckOk;
      }

      // LPS
      if (order?.measureLps && isRelevant('lps')) {
        resultInput.lpsEarthingResistance = data.lpsEarthingResistance ? parseFloat(data.lpsEarthingResistance) : undefined;
        resultInput.lpsContinuityOk = data.lpsContinuityOk;
        resultInput.lpsVisualOk = data.lpsVisualOk;
      }

      // Comments (always available)
      resultInput.comments = data.comments?.trim() || undefined;

      if (isWeb) {
        initWebStorage();
        const now = new Date().toISOString();
        const existingResult = webGetResultByPoint(pointId);
        
        // Create full result object for web storage
        const result: MeasurementResult = {
          id: existingResult?.id || uuidv4(),
          ...resultInput,
          createdAt: existingResult?.createdAt || now,
          updatedAt: now,
        };
        
        webCreateResult(result);
      } else {
        await createOrUpdateResult(resultInput);
      }

      // Navigate back on success
      navigation.goBack();
    } catch (error) {
      console.error('Error saving measurement result:', error);
      Alert.alert(
        'Error',
        'Failed to save measurement result. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // RCD Type picker items
  const rcdTypeItems: PickerItem[] = [
    { label: 'Wybierz typ RCD', value: '' },
    { label: 'AC', value: 'AC' },
    { label: 'A', value: 'A' },
    { label: 'F', value: 'F' },
    { label: 'S', value: 'S' },
  ];

  // Helper function to determine which measurements are relevant for the point type
  const isRelevantForPointType = (measurementType: string): boolean => {
    if (!point) return false;
    
    switch (point.type) {
      case 'socket_1p':
        // For 1-phase sockets: loop impedance, polarity (NO insulation, NO phase sequence, NO breakers)
        return ['loopImpedance', 'polarity'].includes(measurementType);
      
      case 'socket_3p':
        // For 3-phase sockets: loop impedance, phase sequence (NO insulation, NO polarity, NO breakers)
        return ['loopImpedance', 'phaseSequence'].includes(measurementType);
      
      case 'lighting':
        // For lighting: loop impedance, polarity (NO insulation, NO breakers)
        return ['loopImpedance', 'polarity'].includes(measurementType);
      
      case 'rcd':
        // For RCD: RCD measurements only
        return ['rcd'].includes(measurementType);
      
      case 'earthing':
        // For earthing: earthing resistance, PE continuity
        return ['earthing', 'peContinuity'].includes(measurementType);
      
      case 'lps':
        // For LPS: LPS measurements only
        return ['lps'].includes(measurementType);
      
      case 'other':
        // For other: show all enabled measurements
        return true;
      
      default:
        return true;
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!order || !point) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Data not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t.navigation.points}: {point.label}</Text>
        <Text style={styles.subHeaderText}>{t.fields.type}: {getPointTypeLabel(point.type)}</Text>
      </View>

      <View style={styles.form}>
        {/* Loop Impedance Section */}
        {order.measureLoopImpedance && isRelevantForPointType('loopImpedance') && (
          <FormSection title={t.measurementTypes.loopImpedance}>
            <Controller
              control={control}
              name="loopImpedance"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === '') return true; // Optional
                  if (!validateNumeric(value)) return 'Must be a valid number';
                  if (!validateRange(value, 0, 10000)) return 'Must be between 0 and 10000 Ω';
                  return true;
                },
              }}
              render={({ field: { onChange, value } }) => (
                <FormField
                  label={t.measurements.loopImpedance}
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.loopImpedance?.message}
                  placeholder={t.measurements.enterLoopImpedance}
                  keyboardType="numeric"
                />
              )}
            />
            <Controller
              control={control}
              name="loopResultPass"
              render={({ field: { onChange, value } }) => (
                <Switch
                  label={t.measurements.loopResultPass}
                  value={value ?? false}
                  onValueChange={onChange}
                />
              )}
            />
          </FormSection>
        )}

        {/* Insulation Section */}
        {order.measureInsulation && isRelevantForPointType('insulation') && (
          <FormSection title={t.measurementTypes.insulation}>
            <Controller
              control={control}
              name="insulationLn"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === '') return true;
                  if (!validateNumeric(value)) return 'Must be a valid number';
                  if (!validateRange(value, 0, 1000)) return 'Must be between 0 and 1000 MΩ';
                  return true;
                },
              }}
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="L-N (MΩ)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.insulationLn?.message}
                  placeholder={t.measurements.enterInsulationLN}
                  keyboardType="numeric"
                />
              )}
            />
            <Controller
              control={control}
              name="insulationLpe"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === '') return true;
                  if (!validateNumeric(value)) return 'Must be a valid number';
                  if (!validateRange(value, 0, 1000)) return 'Must be between 0 and 1000 MΩ';
                  return true;
                },
              }}
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="L-PE (MΩ)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.insulationLpe?.message}
                  placeholder={t.measurements.enterInsulationLPE}
                  keyboardType="numeric"
                />
              )}
            />
            <Controller
              control={control}
              name="insulationNpe"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === '') return true;
                  if (!validateNumeric(value)) return 'Must be a valid number';
                  if (!validateRange(value, 0, 1000)) return 'Must be between 0 and 1000 MΩ';
                  return true;
                },
              }}
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="N-PE (MΩ)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.insulationNpe?.message}
                  placeholder={t.measurements.enterInsulationNPE}
                  keyboardType="numeric"
                />
              )}
            />
            <Controller
              control={control}
              name="insulationResultPass"
              render={({ field: { onChange, value } }) => (
                <Switch
                  label={t.measurements.insulationResultPass}
                  value={value ?? false}
                  onValueChange={onChange}
                />
              )}
            />
          </FormSection>
        )}

        {/* RCD Section */}
        {order.measureRcd && isRelevantForPointType('rcd') && (
          <FormSection title="RCD">
            <Controller
              control={control}
              name="rcdType"
              render={({ field: { onChange, value } }) => (
                <Picker
                  label={t.measurements.rcdType}
                  value={value ?? ''}
                  items={rcdTypeItems}
                  onValueChange={onChange}
                  placeholder={t.measurements.selectRcdType}
                />
              )}
            />
            <Controller
              control={control}
              name="rcdRatedCurrent"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === '') return true;
                  if (!validateNumeric(value)) return 'Must be a valid number';
                  if (!validateRange(value, 0, 1000)) return 'Must be between 0 and 1000 mA';
                  return true;
                },
              }}
              render={({ field: { onChange, value } }) => (
                <FormField
                  label={t.measurements.rcdRatedCurrent}
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.rcdRatedCurrent?.message}
                  placeholder={t.measurements.enterRatedCurrent}
                  keyboardType="numeric"
                />
              )}
            />
            <Controller
              control={control}
              name="rcdTime1x"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === '') return true;
                  if (!validateNumeric(value)) return 'Must be a valid number';
                  if (!validateRange(value, 0, 1000)) return 'Must be between 0 and 1000 ms';
                  return true;
                },
              }}
              render={({ field: { onChange, value } }) => (
                <FormField
                  label={t.measurements.rcdTime1x}
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.rcdTime1x?.message}
                  placeholder={t.measurements.enterTimeAt1x}
                  keyboardType="numeric"
                />
              )}
            />
            <Controller
              control={control}
              name="rcdTime5x"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === '') return true;
                  if (!validateNumeric(value)) return 'Must be a valid number';
                  if (!validateRange(value, 0, 1000)) return 'Must be between 0 and 1000 ms';
                  return true;
                },
              }}
              render={({ field: { onChange, value } }) => (
                <FormField
                  label={t.measurements.rcdTime5x}
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.rcdTime5x?.message}
                  placeholder={t.measurements.enterTimeAt5x}
                  keyboardType="numeric"
                />
              )}
            />
            <Controller
              control={control}
              name="rcdResultPass"
              render={({ field: { onChange, value } }) => (
                <Switch
                  label={t.measurements.rcdResultPass}
                  value={value ?? false}
                  onValueChange={onChange}
                />
              )}
            />
          </FormSection>
        )}

        {/* PE Continuity Section */}
        {order.measurePeContinuity && isRelevantForPointType('peContinuity') && (
          <FormSection title={t.measurementTypes.peContinuity}>
            <Controller
              control={control}
              name="peResistance"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === '') return true;
                  if (!validateNumeric(value)) return 'Must be a valid number';
                  if (!validateRange(value, 0, 10000)) return 'Must be between 0 and 10000 Ω';
                  return true;
                },
              }}
              render={({ field: { onChange, value } }) => (
                <FormField
                  label={t.measurements.peResistance}
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.peResistance?.message}
                  placeholder={t.measurements.enterPeResistance}
                  keyboardType="numeric"
                />
              )}
            />
            <Controller
              control={control}
              name="peResultPass"
              render={({ field: { onChange, value } }) => (
                <Switch
                  label={t.measurements.peResultPass}
                  value={value ?? false}
                  onValueChange={onChange}
                />
              )}
            />
          </FormSection>
        )}

        {/* Earthing Section */}
        {order.measureEarthing && isRelevantForPointType('earthing') && (
          <FormSection title="Earthing">
            <Controller
              control={control}
              name="earthingResistance"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === '') return true;
                  if (!validateNumeric(value)) return 'Must be a valid number';
                  if (!validateRange(value, 0, 10000)) return 'Must be between 0 and 10000 Ω';
                  return true;
                },
              }}
              render={({ field: { onChange, value } }) => (
                <FormField
                  label={t.measurements.earthingResistance}
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.earthingResistance?.message}
                  placeholder={t.measurements.enterEarthingResistance}
                  keyboardType="numeric"
                />
              )}
            />
            <Controller
              control={control}
              name="earthingResultPass"
              render={({ field: { onChange, value } }) => (
                <Switch
                  label={t.measurements.earthingResultPass}
                  value={value ?? false}
                  onValueChange={onChange}
                />
              )}
            />
          </FormSection>
        )}

        {/* Polarity/Phase Section */}
        {(order.measurePolarity || order.measurePhaseSequence) && 
         (isRelevantForPointType('polarity') || isRelevantForPointType('phaseSequence')) && (
          <FormSection title={t.measurementTypes.polarityAndPhaseSequence}>
            {order.measurePolarity && isRelevantForPointType('polarity') && (
              <Controller
                control={control}
                name="polarityOk"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    label={t.measurements.polarityOk}
                    value={value ?? false}
                    onValueChange={onChange}
                  />
                )}
              />
            )}
            {order.measurePhaseSequence && isRelevantForPointType('phaseSequence') && (
              <Controller
                control={control}
                name="phaseSequenceOk"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    label={t.measurements.phaseSequenceOk}
                    value={value ?? false}
                    onValueChange={onChange}
                  />
                )}
              />
            )}
          </FormSection>
        )}

        {/* Breakers Section */}
        {order.measureBreakersCheck && isRelevantForPointType('breakers') && (
          <FormSection title={t.measurementTypes.breakersCheck}>
            <Controller
              control={control}
              name="breakerCheckOk"
              render={({ field: { onChange, value } }) => (
                <Switch
                  label={t.measurements.breakerCheckOk}
                  value={value ?? false}
                  onValueChange={onChange}
                />
              )}
            />
          </FormSection>
        )}

        {/* LPS Section */}
        {order.measureLps && isRelevantForPointType('lps') && (
          <FormSection title={t.measurementTypes.lps}>
            <Controller
              control={control}
              name="lpsEarthingResistance"
              rules={{
                validate: (value) => {
                  if (!value || value.trim() === '') return true;
                  if (!validateNumeric(value)) return 'Must be a valid number';
                  if (!validateRange(value, 0, 10000)) return 'Must be between 0 and 10000 Ω';
                  return true;
                },
              }}
              render={({ field: { onChange, value } }) => (
                <FormField
                  label={t.measurements.lpsEarthingResistance}
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.lpsEarthingResistance?.message}
                  placeholder={t.measurements.enterLpsEarthingResistance}
                  keyboardType="numeric"
                />
              )}
            />
            <Controller
              control={control}
              name="lpsContinuityOk"
              render={({ field: { onChange, value } }) => (
                <Switch
                  label={t.measurements.lpsContinuityOk}
                  value={value ?? false}
                  onValueChange={onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="lpsVisualOk"
              render={({ field: { onChange, value } }) => (
                <Switch
                  label={t.measurements.lpsVisualOk}
                  value={value ?? false}
                  onValueChange={onChange}
                />
              )}
            />
          </FormSection>
        )}

        {/* Comments Section - Always visible */}
        <FormSection title={t.fields.comments}>
          <Controller
            control={control}
            name="comments"
            render={({ field: { onChange, value } }) => (
              <FormField
                label={t.fields.comments}
                value={value ?? ''}
                onChangeText={onChange}
                placeholder={t.placeholders.enterAdditionalNotesMax200}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
            )}
          />
        </FormSection>

        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          loading={loading}
          style={styles.saveButton}
        >
          {t.measurements.saveMeasurement}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButton: {
    marginTop: 24,
  },
});
