import React from "react";
import { motion } from "framer-motion";
import {
  RadioGroup,
  FileUploader,
  Input,
  Textarea,
  Button,
  Card,
} from "./AuditUi";

const Step3_GeneralInfo = ({ formData, setFormData }) => {
  // This handler function correctly updates the nested state object.
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const keys = name.split(".");
    setFormData((prev) => {
      // Deep copy to avoid direct state mutation
      let temp = JSON.parse(JSON.stringify(prev));
      let current = temp;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = current[keys[i]] || {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = type === "checkbox" ? checked : value;
      return temp;
    });
  };

  // Animation variants for staggering child elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-gray-900">
        Info, Members & Organs
      </h1>
      <p className="mt-2 text-gray-600 text-md">
        Provide all basic information about the cooperative.
      </p>

      <Card className="mt-8">
        <motion.div
          className="p-6 space-y-12 md:p-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Basic Information Section */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="pb-3 text-xl font-semibold text-gray-800 border-b border-gray-200">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <Input
                label="Cooperative Name"
                id="coopName"
                name="generalInfo.basic.coopName"
                value={formData.generalInfo?.basic?.coopName || ""}
                onChange={handleChange}
                placeholder="Official name of your cooperative"
              />
              <Input
                label="Registration Number"
                id="regNumber"
                name="generalInfo.basic.regNumber"
                value={formData.generalInfo?.basic?.regNumber || ""}
                onChange={handleChange}
              />
              <Input
                label="Fiscal Year"
                id="fiscalYear"
                name="generalInfo.basic.fiscalYear"
                value={formData.generalInfo?.basic?.fiscalYear || ""}
                onChange={handleChange}
                placeholder="e.g., 2023/2024"
              />
            </div>
          </motion.div>

          {/* Membership Section */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="pb-3 text-xl font-semibold text-gray-800 border-b border-gray-200">
              Membership
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
              <Input
                label="Number of members"
                type="number"
                id="numMembers"
                name="generalInfo.membership.numMembers"
                value={formData.generalInfo?.membership?.numMembers || ""}
                onChange={handleChange}
              />
              <Input
                label="New members in fiscal year"
                type="number"
                id="newMembers"
                name="generalInfo.membership.newMembers"
                value={formData.generalInfo?.membership?.newMembers || ""}
                onChange={handleChange}
              />
              <Input
                label="Terminations in fiscal year"
                type="number"
                id="termaintions"
                name="generalInfo.membership.terminations"
                value={formData.generalInfo?.membership?.terminations || ""}
                onChange={handleChange}
              />
            </div>
            <RadioGroup
              legend="Is a member list kept?"
              name="generalInfo.membership.isListKept"
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
              ]}
              value={formData.generalInfo?.membership?.isListKept || ""}
              onChange={handleChange}
            />
          </motion.div>

          {/* Organs of the Cooperative Section */}
          <motion.div variants={itemVariants} className="space-y-8">
            <h3 className="pb-3 text-xl font-semibold text-gray-800 border-b border-gray-200">
              Organs of the Cooperative
            </h3>
            <div className="space-y-6">
              <RadioGroup
                legend="The cooperative has not formed a supervisory board."
                name="generalInfo.organs.noSupervisoryBoard"
                options={[
                  { label: "Yes", value: "yes" },
                  { label: "No", value: "no" },
                ]}
                value={formData.generalInfo?.organs?.noSupervisoryBoard || ""}
                onChange={handleChange}
              />
              <RadioGroup
                legend="If the general assembly has elected a representative, this person is a member of the cooperative."
                name="generalInfo.organs.repIsMember"
                options={[
                  { label: "Yes", value: "yes" },
                  { label: "No", value: "no" },
                ]}
                value={formData.generalInfo?.organs?.repIsMember || ""}
                onChange={handleChange}
              />
              <RadioGroup
                legend="The organs of the cooperative, as listed below, are unchanged since the last audit or formation."
                name="generalInfo.organs.organsUnchanged"
                options={[
                  { label: "Yes", value: "yes" },
                  {
                    label: 'No, separate form "Overview of Organs"',
                    value: "no",
                  },
                ]}
                value={formData.generalInfo?.organs?.organsUnchanged || ""}
                onChange={handleChange}
                layout="col"
              />
            </div>

            <div className="pl-4 space-y-4 border-l-2 border-blue-200">
              <h4 className="text-lg font-semibold text-gray-700">
                Executive Board
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <Input
                  label="Chairman"
                  id="chairman"
                  name="generalInfo.organs.board.chairman"
                  value={formData.generalInfo?.organs?.board?.chairman || ""}
                  onChange={handleChange}
                />
                <Input
                  label="Deputy Chairman"
                  id="deputyChairman"
                  name="generalInfo.organs.board.deputy"
                  value={formData.generalInfo?.organs?.board?.deputy || ""}
                  onChange={handleChange}
                />
                <Input
                  label="Member of the Board"
                  id="boardMember"
                  name="generalInfo.organs.board.member"
                  value={formData.generalInfo?.organs?.board?.member || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pl-4 space-y-4 border-l-2 border-blue-200">
              <h4 className="text-lg font-semibold text-gray-700">
                Representative of the General Assembly
              </h4>
              <p className="text-sm text-gray-500">
                (Only fill out if the cooperative has appointed one)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <Input
                  label="Representative"
                  id="repAssembly"
                  name="generalInfo.organs.assemblyRep.representative"
                  value={
                    formData.generalInfo?.organs?.assemblyRep?.representative ||
                    ""
                  }
                  onChange={handleChange}
                />
                <Input
                  label="Deputy Representative"
                  id="depRepAssembly"
                  name="generalInfo.organs.assemblyRep.deputy"
                  value={
                    formData.generalInfo?.organs?.assemblyRep?.deputy || ""
                  }
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pl-4 space-y-4 border-l-2 border-blue-200">
              <h4 className="text-lg font-semibold text-gray-700">
                Supervisory Board
              </h4>
              <p className="text-sm text-gray-500">
                (Only fill out if the cooperative has appointed one)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <Input
                  label="Chairman"
                  id="supervisoryChairman"
                  name="generalInfo.organs.supervisory.chairman"
                  value={
                    formData.generalInfo?.organs?.supervisory?.chairman || ""
                  }
                  onChange={handleChange}
                />
                <Input
                  label="Deputy Chairman"
                  id="supervisoryDeputy"
                  name="generalInfo.organs.supervisory.deputy"
                  value={
                    formData.generalInfo?.organs?.supervisory?.deputy || ""
                  }
                  onChange={handleChange}
                />
                <Input
                  label="Member of the Supervisory Board"
                  id="supervisoryMember1"
                  name="generalInfo.organs.supervisory.member1"
                  value={
                    formData.generalInfo?.organs?.supervisory?.member1 || ""
                  }
                  onChange={handleChange}
                />
                <Input
                  label="Member of the Supervisory Board"
                  id="supervisoryMember2"
                  name="generalInfo.organs.supervisory.member2"
                  value={
                    formData.generalInfo?.organs?.supervisory?.member2 || ""
                  }
                  onChange={handleChange}
                />
                <Input
                  label="Member of the Supervisory Board"
                  id="supervisoryMember3"
                  name="generalInfo.organs.supervisory.member3"
                  value={
                    formData.generalInfo?.organs?.supervisory?.member3 || ""
                  }
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="pt-6 space-y-6 border-t border-gray-200">
              <RadioGroup
                legend="The Executive Board is working on a voluntary basis."
                name="generalInfo.organs.boardVoluntary"
                options={[
                  { label: "Yes", value: "yes" },
                  { label: "No", value: "no" },
                ]}
                value={formData.generalInfo?.organs?.boardVoluntary || ""}
                onChange={handleChange}
              />
              <RadioGroup
                legend="The Supervisory Board or the Representative of the General Assembly is working on a voluntary basis."
                name="generalInfo.organs.supervisoryVoluntary"
                options={[
                  { label: "Yes", value: "yes" },
                  { label: "No", value: "no" },
                ]}
                value={formData.generalInfo?.organs?.supervisoryVoluntary || ""}
                onChange={handleChange}
              />
            </div>
          </motion.div>

          {/* Meetings & Assembly Section */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="space-y-6">
              <h3 className="pb-3 text-xl font-semibold text-gray-800 border-b border-gray-200">
                Minutes of Executive and Supervisory Board Meetings
              </h3>
              <RadioGroup
                legend="No board meetings took place during the relevant audit period."
                name="generalInfo.meetings.noBoardMeetings"
                options={[
                  { label: "Yes", value: "one_member" },
                  { label: "No, see minutes", value: "see_minutes" },
                ]}
                value={formData.generalInfo?.meetings?.noBoardMeetings || ""}
                onChange={handleChange}
                layout="col"
              />
              <RadioGroup
                legend="No supervisory board meetings took place during the relevant audit period."
                name="generalInfo.meetings.noSupervisoryMeetings"
                options={[
                  {
                    label:
                      "Yes, the cooperative has a representative of the general assembly",
                    value: "has_rep",
                  },
                  { label: "No, see minutes", value: "see_minutes" },
                ]}
                value={
                  formData.generalInfo?.meetings?.noSupervisoryMeetings || ""
                }
                onChange={handleChange}
                layout="col"
              />
              <RadioGroup
                legend="No joint meetings of the board and supervisory board took place during the relevant audit period."
                name="generalInfo.meetings.noJointMeetings"
                options={[
                  {
                    label: "Yes, it is a small cooperative",
                    value: "small_coop",
                  },
                  { label: "No, see minutes", value: "see_minutes" },
                ]}
                value={formData.generalInfo?.meetings?.noJointMeetings || ""}
                onChange={handleChange}
                layout="col"
              />
            </div>
            <div className="space-y-6">
              <h3 className="pb-3 text-xl font-semibold text-gray-800 border-b border-gray-200">
                General Assembly
              </h3>
              <RadioGroup
                legend="At least one general assembly was held during the relevant audit period."
                name="generalInfo.assembly.wasConducted"
                options={[
                  { label: "Yes", value: "yes" },
                  { label: "No", value: "no" },
                ]}
                value={formData.generalInfo?.assembly?.wasConducted || ""}
                onChange={handleChange}
              />
              <RadioGroup
                legend="The general assembly has decided on a credit limit in accordance with §49 GenG."
                name="generalInfo.assembly.creditLimitDecided"
                options={[
                  { label: "Yes", value: "yes" },
                  { label: "No", value: "no" },
                ]}
                value={formData.generalInfo?.assembly?.creditLimitDecided || ""}
                onChange={handleChange}
              />
            </div>
          </motion.div>
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default Step3_GeneralInfo;
