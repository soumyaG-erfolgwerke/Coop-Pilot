import React from 'react';
import { motion } from 'framer-motion';
import { RadioGroup, Input, Card } from './AuditUi';

const Step3_GeneralInfo_ReadOnly = ({ formData }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  if (!formData?.generalInfo) return null;

  const readOnlyInput = (label, value) => (
    <Input label={label} value={value || ''} readOnly disabled />
  );

  const readOnlyRadio = (legend, name, options, value, layout) => (
    <RadioGroup
      legend={legend}
      name={name}
      options={options}
      value={value || ''}
      disabled
      layout={layout}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-black">Info, Members & Organs</h1>
      <p className="mt-2 text-md text-gray-600">Basic cooperative data overview.</p>

      <Card className="mt-8">
        <motion.div
          className="p-6 md:p-8 space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Basic Info */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-xl font-semibold text-black border-b border-gray-200 pb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {readOnlyInput('Cooperative Name', formData.generalInfo?.basic?.coopName)}
              {readOnlyInput('Registration Number', formData.generalInfo?.basic?.regNumber)}
              {readOnlyInput('Fiscal Year', formData.generalInfo?.basic?.fiscalYear)}
            </div>
          </motion.div>

          {/* Membership */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-xl font-semibold text-black border-b border-gray-200 pb-3">Membership</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
              {readOnlyInput('Number of Members', formData.generalInfo?.membership?.numMembers)}
              {readOnlyInput('New Members', formData.generalInfo?.membership?.newMembers)}
              {readOnlyInput('Terminations', formData.generalInfo?.membership?.terminations)}
            </div>
            {readOnlyRadio(
              'Is a member list kept?',
              'generalInfo.membership.isListKept',
              [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
              formData.generalInfo?.membership?.isListKept
            )}
          </motion.div>

          {/* Organs */}
          <motion.div variants={itemVariants} className="space-y-8">
            <h3 className="text-xl font-semibold text-black border-b border-gray-200 pb-3">Organs of the Cooperative</h3>
            {readOnlyRadio(
              'The cooperative has not formed a supervisory board.',
              'generalInfo.organs.noSupervisoryBoard',
              [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
              formData.generalInfo?.organs?.noSupervisoryBoard
            )}
            {readOnlyRadio(
              'If the general assembly has elected a representative, this person is a member of the cooperative.',
              'generalInfo.organs.repIsMember',
              [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
              formData.generalInfo?.organs?.repIsMember
            )}
            {readOnlyRadio(
              'The organs of the cooperative are unchanged since the last audit or formation.',
              'generalInfo.organs.organsUnchanged',
              [
                { label: 'Yes', value: 'yes' },
                { label: 'No, separate form "Overview of Organs"', value: 'no' },
              ],
              formData.generalInfo?.organs?.organsUnchanged,
              'col'
            )}

            {/* Executive Board */}
            <div className="space-y-4 pl-4 border-l-2 border-blue-200">
              <h4 className="text-lg font-semibold text-black">Executive Board</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {readOnlyInput('Chairman', formData.generalInfo?.organs?.board?.chairman)}
                {readOnlyInput('Deputy Chairman', formData.generalInfo?.organs?.board?.deputy)}
                {readOnlyInput('Member of the Board', formData.generalInfo?.organs?.board?.member)}
              </div>
            </div>

            {/* Assembly Representative */}
            <div className="space-y-4 pl-4 border-l-2 border-blue-200">
              <h4 className="text-lg font-semibold text-black">Representative of the General Assembly</h4>
              <p className="text-sm text-gray-500">(Only if appointed)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {readOnlyInput('Representative', formData.generalInfo?.organs?.assemblyRep?.representative)}
                {readOnlyInput('Deputy Representative', formData.generalInfo?.organs?.assemblyRep?.deputy)}
              </div>
            </div>

            {/* Supervisory Board */}
            <div className="space-y-4 pl-4 border-l-2 border-blue-200">
              <h4 className="text-lg font-semibold text-black">Supervisory Board</h4>
              <p className="text-sm text-gray-500">(Only if appointed)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {readOnlyInput('Chairman', formData.generalInfo?.organs?.supervisory?.chairman)}
                {readOnlyInput('Deputy Chairman', formData.generalInfo?.organs?.supervisory?.deputy)}
                {readOnlyInput('Member 1', formData.generalInfo?.organs?.supervisory?.member1)}
                {readOnlyInput('Member 2', formData.generalInfo?.organs?.supervisory?.member2)}
                {readOnlyInput('Member 3', formData.generalInfo?.organs?.supervisory?.member3)}
              </div>
            </div>

            {readOnlyRadio(
              'The Executive Board is working on a voluntary basis.',
              'generalInfo.organs.boardVoluntary',
              [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
              formData.generalInfo?.organs?.boardVoluntary
            )}
            {readOnlyRadio(
              'The Supervisory Board or the Representative of the General Assembly is working on a voluntary basis.',
              'generalInfo.organs.supervisoryVoluntary',
              [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
              formData.generalInfo?.organs?.supervisoryVoluntary
            )}
          </motion.div>

          {/* Meetings & Assembly */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-black border-b pb-3">Board & Supervisory Meetings</h3>
              {readOnlyRadio(
                'No board meetings took place during the relevant audit period.',
                'generalInfo.meetings.noBoardMeetings',
                [
                  { label: 'Yes', value: 'one_member' },
                  { label: 'No, see minutes', value: 'see_minutes' },
                ],
                formData.generalInfo?.meetings?.noBoardMeetings,
                'col'
              )}
              {readOnlyRadio(
                'No supervisory board meetings took place during the audit period.',
                'generalInfo.meetings.noSupervisoryMeetings',
                [
                  { label: 'Yes, represented by general assembly', value: 'has_rep' },
                  { label: 'No, see minutes', value: 'see_minutes' },
                ],
                formData.generalInfo?.meetings?.noSupervisoryMeetings,
                'col'
              )}
              {readOnlyRadio(
                'No joint meetings of board and supervisory board occurred.',
                'generalInfo.meetings.noJointMeetings',
                [
                  { label: 'Yes, small cooperative', value: 'small_coop' },
                  { label: 'No, see minutes', value: 'see_minutes' },
                ],
                formData.generalInfo?.meetings?.noJointMeetings,
                'col'
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-black border-b pb-3">General Assembly</h3>
              {readOnlyRadio(
                'At least one general assembly was held during the audit period.',
                'generalInfo.assembly.wasConducted',
                [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
                formData.generalInfo?.assembly?.wasConducted
              )}
              {readOnlyRadio(
                'The general assembly has decided on a credit limit under §49 GenG.',
                'generalInfo.assembly.creditLimitDecided',
                [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
                formData.generalInfo?.assembly?.creditLimitDecided
              )}
            </div>
          </motion.div>
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default Step3_GeneralInfo_ReadOnly;
